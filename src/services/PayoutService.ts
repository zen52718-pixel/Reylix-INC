/**
 * PayoutService (Blueprint Sprint 5) — roll approved-unpaid leads into Payout rows per
 * publisher for a period (YYYY-MM), then mark a payout paid (flipping its leads → paid).
 * Storage-agnostic.
 */
import { NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Lead, PayoutRow } from '@/src/domain/types';
import type { LeadRepo, PayoutRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CommissionSummaryRow {
  publisherId: string;
  owed: number; // approved but unpaid
  paid: number;
}

export class PayoutService {
  constructor(
    private readonly leads: LeadRepo,
    private readonly payouts: PayoutRepo,
    private readonly audit: AuditService,
  ) {}

  /** Generate/refresh payout rows for `period` from each publisher's approved-unpaid leads. */
  async generate(period: string, actor: string): Promise<PayoutRow[]> {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new ValidationError('period must be in YYYY-MM format', { period });
    }
    const approved = (await this.leads.list({ status: 'approved' })).filter(
      (l) => l.publisherId && periodOf(l) === period,
    );

    const byPublisher = new Map<string, { count: number; total: number }>();
    for (const lead of approved) {
      const acc = byPublisher.get(lead.publisherId as string) ?? { count: 0, total: 0 };
      acc.count += 1;
      acc.total += lead.commissionAmount;
      byPublisher.set(lead.publisherId as string, acc);
    }

    const rows: PayoutRow[] = [];
    for (const [publisherId, { count, total }] of byPublisher) {
      const row = await this.payouts.upsertPeriod({
        publisherId,
        periodLabel: period,
        leadCount: count,
        totalCommission: total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      await this.audit.log(actor, 'payout', row.id, 'generated', { period, count, total });
      rows.push(row);
    }
    return rows;
  }

  /** Mark a payout paid and flip its publisher's approved leads in that period → paid. */
  async markPaid(payoutId: string, actor: string): Promise<{ payout: PayoutRow; paidLeads: number }> {
    const payout = await this.payouts.getById(payoutId);
    if (!payout) throw new NotFoundError(`Payout ${payoutId} not found`);

    const approved = (await this.leads.list({ publisherId: payout.publisherId, status: 'approved' })).filter(
      (l) => periodOf(l) === payout.periodLabel,
    );
    for (const lead of approved) {
      await this.leads.updateStatus(lead.id, 'paid', { paidAt: new Date().toISOString() });
    }
    const updated = await this.payouts.markPaid(payoutId);
    await this.audit.log(actor, 'payout', payoutId, 'paid', {
      period: payout.periodLabel,
      paidLeads: approved.length,
    });
    return { payout: updated, paidLeads: approved.length };
  }

  /** Owed (approved, unpaid) vs paid commission per publisher — for the admin commissions view. */
  async commissions(publisherId?: string): Promise<CommissionSummaryRow[]> {
    const leads = await this.leads.list(publisherId ? { publisherId } : undefined);
    const byPublisher = new Map<string, CommissionSummaryRow>();
    for (const lead of leads) {
      if (!lead.publisherId) continue;
      const row = byPublisher.get(lead.publisherId) ?? { publisherId: lead.publisherId, owed: 0, paid: 0 };
      if (lead.status === 'approved') row.owed += lead.commissionAmount;
      if (lead.status === 'paid') row.paid += lead.commissionAmount;
      byPublisher.set(lead.publisherId, row);
    }
    return [...byPublisher.values()];
  }
}

/** The YYYY-MM a lead belongs to: prefer approval month, else creation month. */
function periodOf(lead: Lead): string {
  return (lead.approvedAt ?? lead.createdAt).slice(0, 7);
}
