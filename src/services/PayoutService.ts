/**
 * PayoutService — roll a publisher's payable commissions into a payout for a period,
 * then move that payout through its lifecycle.
 *
 *   pending → approved → processing → paid
 *                              └──────→ failed  (releases its commissions)
 *
 * Payouts operate on COMMISSIONS, not by re-scanning leads. That is what makes a failed
 * ACH expressible: the commissions are released back to payable and the next run picks
 * them up, which the old two-state model could not represent.
 *
 * Storage-agnostic.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Commission, PayoutRow, PayoutStatus } from '@/src/domain/types';
import type { CommissionRepo, LeadRepo, PayoutRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CommissionSummaryRow {
  publisherId: string;
  owed: number; // payable or processing — earned but not yet paid
  paid: number;
}

/** Legal payout transitions. Anything else is a 409. */
const LEGAL: Record<PayoutStatus, PayoutStatus[]> = {
  pending: ['approved', 'failed'],
  approved: ['processing', 'failed'],
  processing: ['paid', 'failed'],
  paid: [],
  failed: [],
};

export class PayoutService {
  constructor(
    private readonly leads: LeadRepo,
    private readonly payouts: PayoutRepo,
    private readonly commissions: CommissionRepo,
    private readonly audit: AuditService,
  ) {}

  /**
   * Generate or refresh payout rows for `period` from each publisher's payable
   * commissions. Commissions are stamped with the payout id but stay `payable` until the
   * payout actually starts processing — being in a draft batch is not the same as being
   * on its way to a bank.
   */
  async generate(period: string, actor: string): Promise<PayoutRow[]> {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new ValidationError('period must be in YYYY-MM format', { period });
    }
    const payable = (await this.commissions.list({ status: 'payable' })).filter(
      (c) => periodOf(c) === period,
    );

    const byPublisher = new Map<string, Commission[]>();
    for (const c of payable) {
      const list = byPublisher.get(c.publisherId) ?? [];
      list.push(c);
      byPublisher.set(c.publisherId, list);
    }

    const result: PayoutRow[] = [];
    for (const [publisherId, list] of byPublisher) {
      const total = list.reduce((acc, c) => acc + c.amount, 0);
      const row = await this.payouts.upsertPeriod({
        publisherId,
        periodLabel: period,
        leadCount: list.length,
        totalCommission: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      for (const c of list) {
        await this.commissions.update(c.id, { payoutId: row.id });
      }
      await this.audit.log(actor, 'payout', row.id, 'generated', {
        period,
        count: list.length,
        total,
      });
      result.push(row);
    }
    return result;
  }

  /** pending → approved. */
  async approve(payoutId: string, actor: string): Promise<PayoutRow> {
    return this.move(payoutId, 'approved', actor);
  }

  /** approved → processing. Commissions move with it: the money is now in flight. */
  async markProcessing(payoutId: string, actor: string): Promise<PayoutRow> {
    const payout = await this.move(payoutId, 'processing', actor);
    for (const c of await this.commissions.list({ payoutId, status: 'payable' })) {
      await this.commissions.update(c.id, { status: 'processing' });
    }
    return payout;
  }

  /**
   * processing → paid. Commissions become paid and their leads follow, which is the only
   * place a lead reaches `paid`.
   */
  async markPaid(
    payoutId: string,
    actor: string,
    opts?: { method?: PayoutRow['method']; reference?: string },
  ): Promise<{ payout: PayoutRow; paidCommissions: number }> {
    const paidAt = new Date().toISOString();
    const payout = await this.move(payoutId, 'paid', actor, {
      paidAt,
      method: opts?.method,
      reference: opts?.reference,
    });

    const inFlight = (await this.commissions.list({ payoutId })).filter(
      (c) => c.status === 'processing' || c.status === 'payable',
    );
    for (const c of inFlight) {
      await this.commissions.update(c.id, { status: 'paid', paidAt });
      const lead = await this.leads.getById(c.leadId);
      if (lead?.status === 'approved') {
        await this.leads.updateStatus(c.leadId, 'paid', { paidAt });
      }
    }
    return { payout, paidCommissions: inFlight.length };
  }

  /**
   * Any state → failed. The batch's commissions are released back to payable and their
   * payout link cleared, so nothing is stranded and the next run collects them again.
   */
  async markFailed(payoutId: string, actor: string, reason: string): Promise<PayoutRow> {
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('A failure reason is required', { payoutId });
    }
    const payout = await this.move(payoutId, 'failed', actor, { failureReason: trimmed });

    for (const c of await this.commissions.list({ payoutId })) {
      if (c.status === 'paid') continue; // already settled; a reversal is a clawback, not a release
      await this.commissions.update(c.id, { status: 'payable', payoutId: undefined });
    }
    return payout;
  }

  /** Owed (earned, not yet paid) vs paid commission per publisher. */
  async commissions_summary(publisherId?: string): Promise<CommissionSummaryRow[]> {
    const all = await this.commissions.list(publisherId ? { publisherId } : undefined);
    const byPublisher = new Map<string, CommissionSummaryRow>();
    for (const c of all) {
      const row = byPublisher.get(c.publisherId) ?? { publisherId: c.publisherId, owed: 0, paid: 0 };
      if (c.status === 'payable' || c.status === 'processing') row.owed += c.amount;
      if (c.status === 'paid') row.paid += c.amount;
      byPublisher.set(c.publisherId, row);
    }
    return [...byPublisher.values()];
  }

  private async move(
    payoutId: string,
    target: PayoutStatus,
    actor: string,
    patch?: Partial<PayoutRow>,
  ): Promise<PayoutRow> {
    const payout = await this.payouts.getById(payoutId);
    if (!payout) throw new NotFoundError(`Payout ${payoutId} not found`);
    if (!LEGAL[payout.status].includes(target)) {
      throw new ConflictError(`Illegal payout transition ${payout.status} → ${target}`, {
        payoutId,
        from: payout.status,
        to: target,
      });
    }
    const updated = await this.payouts.transition(payoutId, target, patch);
    await this.audit.log(actor, 'payout', payoutId, target, {
      from: payout.status,
      to: target,
      ...(patch ?? {}),
    });
    return updated;
  }
}

/** The YYYY-MM a commission belongs to — the month it was approved. */
function periodOf(commission: Commission): string {
  return commission.createdAt.slice(0, 7);
}
