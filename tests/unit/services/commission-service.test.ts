import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/src/domain/errors';
import type { Lead } from '@/src/domain/types';
import { MemoryAuditRepo } from '@/src/repositories/memory/MemoryAuditRepo';
import { MemoryLeadRepo } from '@/src/repositories/memory/MemoryLeadRepo';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { AuditService } from '@/src/services/AuditService';
import { CommissionService } from '@/src/services/CommissionService';

async function setup() {
  const leads = new MemoryLeadRepo();
  const offers = new MemoryOfferRepo();
  const auditRepo = new MemoryAuditRepo();
  const audit = new AuditService(auditRepo);
  const offer = await offers.create({
    buyerId: 'buyer-1',
    offerCode: 'MVA1',
    name: 'MVA',
    destinationUrl: 'https://x.com',
    commissionAmount: 5000,
    currency: 'USD',
    isActive: true,
  });
  const service = new CommissionService(leads, offers, audit);
  return { service, leads, offers, auditRepo, offer };
}

async function newLead(leads: MemoryLeadRepo, offerId: string | null): Promise<Lead> {
  return leads.append({
    publisherId: 'p1',
    offerId,
    refCode: 'AHMED-MVA1',
    buyerId: 'buyer-1',
    attributionSource: 'param',
    status: 'new',
    commissionAmount: 0,
    capturedData: {},
    createdAt: new Date().toISOString(),
  });
}

describe('CommissionService transitions', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  it('new → approved locks commission to the offer amount, sets approved_at, audits', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    const approved = await ctx.service.approve(lead.id, 'admin@x');
    expect(approved.status).toBe('approved');
    expect(approved.commissionAmount).toBe(5000);
    expect(approved.approvedAt).toBeTruthy();
    const audit = await ctx.auditRepo.list({ action: 'approved' });
    expect(audit).toHaveLength(1);
  });

  it('new → rejected zeroes commission and records the reason', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    const rejected = await ctx.service.reject(lead.id, 'admin@x', 'spam');
    expect(rejected.status).toBe('rejected');
    expect(rejected.commissionAmount).toBe(0);
    expect(rejected.rejectReason).toBe('spam');
  });

  it('approved → paid sets paid_at', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    await ctx.service.approve(lead.id, 'admin@x');
    const paid = await ctx.service.markPaid(lead.id, 'admin@x');
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeTruthy();
  });

  it('rejects illegal transitions with ConflictError (409)', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    await expect(ctx.service.markPaid(lead.id, 'admin@x')).rejects.toBeInstanceOf(ConflictError); // new→paid
    await ctx.service.approve(lead.id, 'admin@x');
    await expect(ctx.service.approve(lead.id, 'admin@x')).rejects.toBeInstanceOf(ConflictError); // approved→approved
  });

  it('refuses to approve a lead with no offer', async () => {
    const lead = await newLead(ctx.leads, null);
    await expect(ctx.service.approve(lead.id, 'admin@x')).rejects.toBeInstanceOf(ConflictError);
  });

  it('assigns an unattributed lead (manual) and overrides commission', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    const assigned = await ctx.service.assign(lead.id, 'publisher-9', 'admin@x');
    expect(assigned.publisherId).toBe('publisher-9');
    expect(assigned.attributionSource).toBe('manual');
    const overridden = await ctx.service.overrideCommission(lead.id, 1234, 'admin@x');
    expect(overridden.commissionAmount).toBe(1234);
  });

  it('stores the override flag + amount and uses offer commission as the default', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id); // offer commission = 5000
    const approvedDefault = await ctx.service.approve(lead.id, 'admin@x');
    expect(approvedDefault.commissionAmount).toBe(5000); // no override → offer default
  });

  it('preserves a commission override through approval (override wins over offer)', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    const o = await ctx.service.overrideCommission(lead.id, 1234, 'admin@x');
    expect(o.commissionOverrideEnabled).toBe(true);
    expect(o.commissionOverrideAmount).toBe(1234);
    expect(o.commissionAmount).toBe(1234);

    const approved = await ctx.service.approve(lead.id, 'admin@x');
    expect(approved.commissionAmount).toBe(1234); // not the offer's 5000
  });

  it('clearing the override reverts an approved lead to the offer commission', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    await ctx.service.overrideCommission(lead.id, 1234, 'admin@x');
    await ctx.service.approve(lead.id, 'admin@x');

    const cleared = await ctx.service.clearCommissionOverride(lead.id, 'admin@x');
    expect(cleared.commissionOverrideEnabled).toBe(false);
    expect(cleared.commissionAmount).toBe(5000); // back to offer default
  });

  it('approve locks the admin-entered commission amount (overrides the offer default)', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id); // offer commission = 5000
    const approved = await ctx.service.approve(lead.id, 'admin@x', 1500);
    expect(approved.status).toBe('approved');
    expect(approved.commissionAmount).toBe(1500);
  });

  it('reject requires a non-empty reason', async () => {
    const lead = await newLead(ctx.leads, ctx.offer.id);
    await expect(ctx.service.reject(lead.id, 'admin@x', '   ')).rejects.toBeInstanceOf(ValidationError);
  });
});
