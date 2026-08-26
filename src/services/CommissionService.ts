/**
 * CommissionService — lead status transitions and the commission records they produce.
 *
 * Enforces the transition contract:
 *   new → approved : admin enters the amount; a Commission record is created
 *   new → rejected : reason required; NO commission record is created
 *   approved → paid : paidAt stamped (normally driven by PayoutService)
 *   anything else  : ConflictError → 409
 *
 * Commission is a RECORD, not a number on the lead. That is what makes a payout
 * lifecycle and a clawback expressible, and it means the amount is immutable once
 * written: a correction is a void plus a new record, never an edit.
 *
 * An UNATTRIBUTED lead can still be approved — the client wants it — but produces no
 * commission, because there is nobody to pay.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Commission, Lead, LeadStatus } from '@/src/domain/types';
import { DEFAULT_CURRENCY } from '@/src/domain/types';
import type {
  CommissionFilter,
  CommissionRepo,
  LeadAttributionRepo,
  LeadRepo,
  OfferRepo,
} from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface ApproveResult {
  lead: Lead;
  commission: Commission | null;
}

export class CommissionService {
  constructor(
    private readonly leads: LeadRepo,
    private readonly offers: OfferRepo,
    private readonly commissions: CommissionRepo,
    private readonly attributions: LeadAttributionRepo,
    private readonly audit: AuditService,
  ) {}

  /**
   * new → approved. The admin sets the commission per lead; the offer's amount pre-fills
   * that decision. The value is locked onto a new Commission record at this moment, so a
   * later change to the offer never alters what has already been earned.
   */
  async approve(leadId: string, actor: string, commissionAmount?: number): Promise<ApproveResult> {
    const lead = await this.requireLead(leadId);
    this.assertTransition(lead.status, 'approved');
    if (!lead.offerId) {
      throw new ConflictError('Lead has no offer; assign one before approving', { leadId });
    }
    const offer = await this.offers.getById(lead.offerId);
    if (!offer) throw new NotFoundError(`Offer ${lead.offerId} not found`);

    const adminEntered = commissionAmount !== undefined && commissionAmount !== null;
    if (adminEntered && (!Number.isFinite(commissionAmount) || (commissionAmount as number) < 0)) {
      throw new ValidationError('commission must be a non-negative number', { commissionAmount });
    }
    // Only the flat model is calculated in V1. Any other model must be priced explicitly
    // rather than silently falling back to the offer's flat amount.
    if (!adminEntered && offer.commissionModel !== 'flat') {
      throw new ValidationError(
        `Offer uses the ${offer.commissionModel} model, so the commission amount must be entered explicitly`,
        { leadId, commissionModel: offer.commissionModel },
      );
    }
    const amount = adminEntered ? (commissionAmount as number) : offer.commissionAmount;

    const approvedAt = new Date().toISOString();
    const updated = await this.leads.updateStatus(leadId, 'approved', { approvedAt });

    const attribution = await this.attributions.getCurrentForLead(leadId);
    let commission: Commission | null = null;
    if (attribution) {
      commission = await this.commissions.create({
        leadId,
        publisherId: attribution.publisherId,
        offerId: offer.id,
        clientId: offer.clientId,
        amount,
        currency: offer.currency || DEFAULT_CURRENCY,
        model: offer.commissionModel,
        status: 'payable',
        approvedBy: actor,
        createdAt: approvedAt,
      });
    }

    await this.audit.log(actor, 'lead', leadId, 'approved', {
      amount,
      adminEntered,
      attributed: Boolean(attribution),
      commissionId: commission?.id ?? null,
    });
    return { lead: updated, commission };
  }

  /** new → rejected: records a required reason. No commission record is created. */
  async reject(leadId: string, actor: string, reason: string): Promise<Lead> {
    const lead = await this.requireLead(leadId);
    this.assertTransition(lead.status, 'rejected');
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('Rejection reason is required.', { leadId });
    }
    const updated = await this.leads.updateStatus(leadId, 'rejected', { rejectReason: trimmed });
    await this.audit.log(actor, 'lead', leadId, 'rejected', { reason: trimmed });
    return updated;
  }

  /** approved → paid. Normally reached through PayoutService rather than directly. */
  async markPaid(leadId: string, actor: string): Promise<Lead> {
    const lead = await this.requireLead(leadId);
    this.assertTransition(lead.status, 'paid');
    const paidAt = new Date().toISOString();
    const updated = await this.leads.updateStatus(leadId, 'paid', { paidAt });
    await this.audit.log(actor, 'lead', leadId, 'paid', {});
    return updated;
  }

  /** Dispatch a target transition (used by the admin status endpoint). */
  async transition(
    leadId: string,
    target: LeadStatus,
    actor: string,
    opts?: { reason?: string; commissionAmount?: number },
  ): Promise<Lead> {
    switch (target) {
      case 'approved':
        return (await this.approve(leadId, actor, opts?.commissionAmount)).lead;
      case 'rejected':
        return this.reject(leadId, actor, opts?.reason ?? '');
      case 'paid':
        return this.markPaid(leadId, actor);
      default:
        throw new ConflictError(`Unsupported target status: ${target}`, { leadId, target });
    }
  }

  /**
   * Reverse a commission after approval.
   *
   * An unpaid commission is voided. A commission that has already been paid becomes a
   * clawback rather than disappearing — a publisher must be able to see that money was
   * reclaimed and why, so this is never a silent deduction.
   */
  async voidCommission(leadId: string, actor: string, reason: string): Promise<Commission> {
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('A reason is required to void a commission', { leadId });
    }
    const live = await this.commissions.getLiveForLead(leadId);
    if (!live) throw new NotFoundError(`No live commission for lead ${leadId}`, { leadId });

    const status = live.status === 'paid' ? 'clawed_back' : 'void';
    const updated = await this.commissions.update(live.id, {
      status,
      voidedAt: new Date().toISOString(),
      voidReason: trimmed,
    });
    await this.audit.log(actor, 'commission', live.id, status, {
      leadId,
      amount: live.amount,
      reason: trimmed,
    });
    return updated;
  }

  async list(filter?: CommissionFilter): Promise<Commission[]> {
    return this.commissions.list(filter);
  }

  async getForLead(leadId: string): Promise<Commission | null> {
    return this.commissions.getLiveForLead(leadId);
  }

  private assertTransition(from: LeadStatus, to: LeadStatus): void {
    const legal: Record<LeadStatus, LeadStatus[]> = {
      new: ['approved', 'rejected'],
      approved: ['paid'],
      rejected: [],
      paid: [],
    };
    if (!legal[from].includes(to)) {
      throw new ConflictError(`Illegal transition ${from} → ${to}`, { from, to });
    }
  }

  private async requireLead(leadId: string): Promise<Lead> {
    const lead = await this.leads.getById(leadId);
    if (!lead) throw new NotFoundError(`Lead ${leadId} not found`);
    return lead;
  }
}
