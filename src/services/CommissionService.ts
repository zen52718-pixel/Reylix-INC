/**
 * CommissionService (Blueprint Sprint 5) — lead status transitions with the commission
 * lock + audit. Enforces the transition contract (§4.3):
 *   new → approved : commission_amount = offer.commission_amount (LOCKED), approved_at
 *   new → rejected : commission_amount = 0, reject_reason
 *   approved → paid : paid_at
 *   anything else  : ConflictError (illegal transition → 409)
 * Also handles manual assign of unattributed leads and commission overrides.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Lead, LeadStatus } from '@/src/domain/types';
import type { LeadRepo, OfferRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export class CommissionService {
  constructor(
    private readonly leads: LeadRepo,
    private readonly offers: OfferRepo,
    private readonly audit: AuditService,
  ) {}

  /**
   * new → approved. The admin sets the commission per lead (`commissionAmount`); that value
   * is locked onto the lead. When no amount is supplied (e.g. legacy callers), it falls back
   * to a per-lead override, then to the offer's default. Stores via the existing
   * commission_amount field — payouts/reports are unchanged.
   */
  async approve(leadId: string, actor: string, commissionAmount?: number): Promise<Lead> {
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

    // Priority: admin-entered amount → per-lead override → offer default.
    const locked = adminEntered
      ? (commissionAmount as number)
      : lead.commissionOverrideEnabled
        ? (lead.commissionOverrideAmount ?? 0)
        : offer.commissionAmount;

    const updated = await this.leads.updateStatus(leadId, 'approved', {
      approvedAt: new Date().toISOString(),
      commissionAmount: locked,
    });
    await this.audit.log(actor, 'lead', leadId, 'approved', {
      commissionAmount: locked,
      adminEntered,
    });
    return updated;
  }

  /** new → rejected: zeroes commission and records a (required) reason. */
  async reject(leadId: string, actor: string, reason: string): Promise<Lead> {
    const lead = await this.requireLead(leadId);
    this.assertTransition(lead.status, 'rejected');
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('Rejection reason is required.', { leadId });
    }
    const updated = await this.leads.updateStatus(leadId, 'rejected', {
      commissionAmount: 0,
      rejectReason: trimmed,
    });
    await this.audit.log(actor, 'lead', leadId, 'rejected', { reason: trimmed });
    return updated;
  }

  /** approved → paid. */
  async markPaid(leadId: string, actor: string): Promise<Lead> {
    const lead = await this.requireLead(leadId);
    this.assertTransition(lead.status, 'paid');
    const updated = await this.leads.updateStatus(leadId, 'paid', {
      paidAt: new Date().toISOString(),
    });
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
        return this.approve(leadId, actor, opts?.commissionAmount);
      case 'rejected':
        return this.reject(leadId, actor, opts?.reason ?? '');
      case 'paid':
        return this.markPaid(leadId, actor);
      default:
        throw new ConflictError(`Unsupported target status: ${target}`, { leadId, target });
    }
  }

  /** Assign an (unattributed) lead to a publisher — manual attribution. */
  async assign(leadId: string, publisherId: string, actor: string): Promise<Lead> {
    await this.requireLead(leadId);
    const updated = await this.leads.update(leadId, { publisherId, attributionSource: 'manual' });
    await this.audit.log(actor, 'lead', leadId, 'assigned', { publisherId });
    return updated;
  }

  /**
   * Enable a per-lead commission override. Stores the override flag + amount AND sets the
   * effective `commissionAmount` so existing dashboards/reports/payouts (which read
   * commissionAmount) reflect it automatically. If the lead is later approved, approve()
   * keeps the override (see above).
   */
  async overrideCommission(leadId: string, amount: number, actor: string): Promise<Lead> {
    await this.requireLead(leadId);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new ValidationError('commission must be a non-negative number', { amount });
    }
    const updated = await this.leads.update(leadId, {
      commissionOverrideEnabled: true,
      commissionOverrideAmount: amount,
      commissionAmount: amount,
    });
    await this.audit.log(actor, 'lead', leadId, 'commission_override', { amount });
    return updated;
  }

  /**
   * Clear the override → fall back to the offer commission. For an already-approved/paid
   * lead the effective amount reverts to the offer's commission; for a still-`new` lead the
   * effective amount remains 0 until it locks at approval.
   */
  async clearCommissionOverride(leadId: string, actor: string): Promise<Lead> {
    const lead = await this.requireLead(leadId);
    let commissionAmount = lead.commissionAmount;
    if ((lead.status === 'approved' || lead.status === 'paid') && lead.offerId) {
      const offer = await this.offers.getById(lead.offerId);
      commissionAmount = offer ? offer.commissionAmount : lead.commissionAmount;
    } else if (lead.status === 'new') {
      commissionAmount = 0;
    }
    const updated = await this.leads.update(leadId, {
      commissionOverrideEnabled: false,
      commissionOverrideAmount: 0,
      commissionAmount,
    });
    await this.audit.log(actor, 'lead', leadId, 'commission_override_cleared', {});
    return updated;
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
