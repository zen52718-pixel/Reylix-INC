import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/src/domain/errors';
import { AuditService } from '@/src/services/AuditService';
import { CommissionService } from '@/src/services/CommissionService';
import { PayoutService } from '@/src/services/PayoutService';
import { seedAttributedLead, seedChain, type SeededChain } from '@/tests/support/fixtures';

function build(chain: SeededChain) {
  const audit = new AuditService(chain.repos.audit);
  return {
    commission: new CommissionService(
      chain.repos.leads,
      chain.repos.offers,
      chain.repos.commissions,
      chain.repos.leadAttributions,
      audit,
    ),
    payouts: new PayoutService(
      chain.repos.leads,
      chain.repos.payouts,
      chain.repos.commissions,
      audit,
    ),
  };
}

const period = () => new Date().toISOString().slice(0, 7);

describe('PayoutService', () => {
  let chain: SeededChain;
  let svc: ReturnType<typeof build>;

  beforeEach(async () => {
    chain = await seedChain({ commissionAmount: 5000 });
    svc = build(chain);
  });

  it('validates the period format', async () => {
    await expect(svc.payouts.generate('2026-5', 'admin')).rejects.toBeInstanceOf(ValidationError);
  });

  it('rolls payable commissions into one payout per publisher', async () => {
    const a = await seedAttributedLead(chain);
    const b = await seedAttributedLead(chain);
    await svc.commission.approve(a.lead.id, 'admin');
    await svc.commission.approve(b.lead.id, 'admin');

    const rows = await svc.payouts.generate(period(), 'admin');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.leadCount).toBe(2);
    expect(rows[0]?.totalCommission).toBe(10000);
    expect(rows[0]?.status).toBe('pending');

    // Commissions are stamped with the payout but stay payable: being in a draft batch
    // is not the same as being on the way to a bank.
    const stamped = await chain.repos.commissions.list({ payoutId: rows[0]!.id });
    expect(stamped).toHaveLength(2);
    expect(stamped.every((c) => c.status === 'payable')).toBe(true);
  });

  it('moves through pending → approved → processing → paid, settling leads', async () => {
    const { lead } = await seedAttributedLead(chain);
    await svc.commission.approve(lead.id, 'admin');
    const [payout] = await svc.payouts.generate(period(), 'admin');

    await svc.payouts.approve(payout!.id, 'admin');
    await svc.payouts.markProcessing(payout!.id, 'admin');
    expect((await chain.repos.commissions.list({ payoutId: payout!.id }))[0]?.status).toBe(
      'processing',
    );

    const { payout: paid, paidCommissions } = await svc.payouts.markPaid(payout!.id, 'admin', {
      method: 'ach',
      reference: 'ACH-123',
    });
    expect(paid.status).toBe('paid');
    expect(paid.reference).toBe('ACH-123');
    expect(paidCommissions).toBe(1);
    expect((await chain.repos.commissions.list({ payoutId: payout!.id }))[0]?.status).toBe('paid');
    // The lead follows the money — this is the only place a lead reaches `paid`.
    expect((await chain.repos.leads.getById(lead.id))?.status).toBe('paid');
  });

  it('a failed payout releases its commissions back to payable', async () => {
    const { lead } = await seedAttributedLead(chain);
    await svc.commission.approve(lead.id, 'admin');
    const [payout] = await svc.payouts.generate(period(), 'admin');
    await svc.payouts.approve(payout!.id, 'admin');
    await svc.payouts.markProcessing(payout!.id, 'admin');

    const failed = await svc.payouts.markFailed(payout!.id, 'admin', 'bank rejected the transfer');
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('bank rejected the transfer');

    // Nothing is stranded: the next run collects them again.
    const released = await chain.repos.commissions.list({ publisherId: chain.publisherId });
    expect(released[0]?.status).toBe('payable');
    expect(released[0]?.payoutId).toBeUndefined();
    // And the lead was never marked paid.
    expect((await chain.repos.leads.getById(lead.id))?.status).toBe('approved');
  });

  it('requires a reason to fail a payout', async () => {
    const { lead } = await seedAttributedLead(chain);
    await svc.commission.approve(lead.id, 'admin');
    const [payout] = await svc.payouts.generate(period(), 'admin');
    await expect(svc.payouts.markFailed(payout!.id, 'admin', '  ')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('refuses an illegal payout transition', async () => {
    const { lead } = await seedAttributedLead(chain);
    await svc.commission.approve(lead.id, 'admin');
    const [payout] = await svc.payouts.generate(period(), 'admin');
    // pending cannot jump straight to paid.
    await expect(svc.payouts.markPaid(payout!.id, 'admin')).rejects.toBeInstanceOf(ConflictError);
  });

  it('summarises owed versus paid per publisher', async () => {
    const a = await seedAttributedLead(chain);
    const b = await seedAttributedLead(chain);
    await svc.commission.approve(a.lead.id, 'admin', 3000);
    const approvedB = await svc.commission.approve(b.lead.id, 'admin', 2000);
    await chain.repos.commissions.update(approvedB.commission!.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });

    const [summary] = await svc.payouts.commissions_summary(chain.publisherId);
    expect(summary?.owed).toBe(3000);
    expect(summary?.paid).toBe(2000);
  });

  it('excludes voided commissions from a payout run', async () => {
    const a = await seedAttributedLead(chain);
    const b = await seedAttributedLead(chain);
    await svc.commission.approve(a.lead.id, 'admin', 3000);
    await svc.commission.approve(b.lead.id, 'admin', 2000);
    await svc.commission.voidCommission(b.lead.id, 'admin', 'duplicate consumer');

    const [payout] = await svc.payouts.generate(period(), 'admin');
    expect(payout?.totalCommission).toBe(3000);
    expect(payout?.leadCount).toBe(1);
  });
});
