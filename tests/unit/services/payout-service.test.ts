import { describe, expect, it } from 'vitest';
import { MemoryAuditRepo } from '@/src/repositories/memory/MemoryAuditRepo';
import { MemoryLeadRepo } from '@/src/repositories/memory/MemoryLeadRepo';
import { MemoryPayoutRepo } from '@/src/repositories/memory/MemoryPayoutRepo';
import { AuditService } from '@/src/services/AuditService';
import { PayoutService } from '@/src/services/PayoutService';

async function setup() {
  const leads = new MemoryLeadRepo();
  const payouts = new MemoryPayoutRepo();
  const audit = new AuditService(new MemoryAuditRepo());
  const service = new PayoutService(leads, payouts, audit);
  return { service, leads, payouts };
}

async function approvedLead(leads: MemoryLeadRepo, publisherId: string, commission: number) {
  return leads.append({
    publisherId,
    offerId: 'o1',
    refCode: 'R',
    buyerId: 'buyer-1',
    attributionSource: 'param',
    status: 'approved',
    commissionAmount: commission,
    capturedData: {},
    createdAt: '2026-05-01T00:00:00.000Z',
    approvedAt: '2026-05-10T00:00:00.000Z',
  });
}

describe('PayoutService', () => {
  it('generates one payout row per publisher from approved-unpaid leads in the period', async () => {
    const { service, leads } = await setup();
    await approvedLead(leads, 'p1', 5000);
    await approvedLead(leads, 'p1', 5000);
    await approvedLead(leads, 'p2', 3000);

    const rows = await service.generate('2026-05', 'admin@x');
    expect(rows).toHaveLength(2);
    const p1 = rows.find((r) => r.publisherId === 'p1');
    expect(p1?.leadCount).toBe(2);
    expect(p1?.totalCommission).toBe(10000);
    expect(p1?.status).toBe('pending');
  });

  it('rejects an invalid period format', async () => {
    const { service } = await setup();
    await expect(service.generate('2026/05', 'admin@x')).rejects.toThrow();
  });

  it('mark-paid flips the publisher’s approved leads in the period to paid', async () => {
    const { service, leads } = await setup();
    await approvedLead(leads, 'p1', 5000);
    await approvedLead(leads, 'p1', 5000);
    const [row] = await service.generate('2026-05', 'admin@x');

    const result = await service.markPaid(row!.id, 'admin@x');
    expect(result.payout.status).toBe('paid');
    expect(result.paidLeads).toBe(2);
    const remainingApproved = await leads.list({ publisherId: 'p1', status: 'approved' });
    expect(remainingApproved).toHaveLength(0);
    const paid = await leads.list({ publisherId: 'p1', status: 'paid' });
    expect(paid).toHaveLength(2);
  });

  it('summarizes owed vs paid commission per publisher', async () => {
    const { service, leads } = await setup();
    await approvedLead(leads, 'p1', 5000); // owed
    await leads.append({
      publisherId: 'p1',
      offerId: 'o1',
      refCode: 'R',
      buyerId: 'buyer-1',
      attributionSource: 'param',
      status: 'paid',
      commissionAmount: 2000,
      capturedData: {},
      createdAt: '2026-04-01T00:00:00.000Z',
    });
    const rows = await service.commissions('p1');
    expect(rows[0]?.owed).toBe(5000);
    expect(rows[0]?.paid).toBe(2000);
  });
});
