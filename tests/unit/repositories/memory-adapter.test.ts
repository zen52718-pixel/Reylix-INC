/**
 * Memory-adapter specifics.
 *
 * Shared behaviour lives in contract.test.ts. What is tested here is what only the memory
 * adapter can be asked about: store isolation, and that it refuses the same things the
 * Postgres unique indexes refuse. If the two disagree, the contract test is lying about
 * their equivalence.
 */
import { describe, expect, it } from 'vitest';
import { ConflictError } from '@/src/domain/errors';
import { createMemoryRepositories } from '@/src/repositories/memory';
import { seedChain } from '@/tests/support/fixtures';

describe('memory adapter', () => {
  it('returns fully isolated stores per bundle', async () => {
    const a = createMemoryRepositories();
    const b = createMemoryRepositories();

    await seedChain({ repos: a });
    expect(await a.clients.list()).toHaveLength(1);
    expect(await b.clients.list()).toHaveLength(0);
  });

  it('refuses a second live attribution for one lead', async () => {
    const chain = await seedChain();
    const lead = await chain.repos.leads.append({
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: chain.refCode,
      status: 'new',
      capturedData: {},
      createdAt: new Date().toISOString(),
    });

    const row = {
      leadId: lead.id,
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      source: 'param' as const,
      attributedAt: new Date().toISOString(),
    };
    await chain.repos.leadAttributions.append(row);

    // Mirrors the unique partial index `lead_attributions_one_live_per_lead`.
    await expect(chain.repos.leadAttributions.append(row)).rejects.toBeInstanceOf(ConflictError);
  });

  it('refuses a second live commission for one lead', async () => {
    const chain = await seedChain();
    const lead = await chain.repos.leads.append({
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: chain.refCode,
      status: 'approved',
      capturedData: {},
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    });

    const row = {
      leadId: lead.id,
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      amount: 5000,
      currency: 'USD',
      model: 'flat' as const,
      status: 'payable' as const,
      createdAt: new Date().toISOString(),
    };
    await chain.repos.commissions.create(row);

    // Paying twice for one lead is the failure this guard exists to prevent.
    await expect(chain.repos.commissions.create(row)).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows a new commission once the previous one is voided', async () => {
    const chain = await seedChain();
    const lead = await chain.repos.leads.append({
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: chain.refCode,
      status: 'approved',
      capturedData: {},
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    });
    const base = {
      leadId: lead.id,
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      currency: 'USD',
      model: 'flat' as const,
      status: 'payable' as const,
      createdAt: new Date().toISOString(),
    };

    const first = await chain.repos.commissions.create({ ...base, amount: 5000 });
    await chain.repos.commissions.update(first.id, {
      status: 'void',
      voidReason: 'client reversed',
    });

    // A correction is a void plus a new record — so the replacement must be allowed.
    const replacement = await chain.repos.commissions.create({ ...base, amount: 2500 });
    expect(replacement.amount).toBe(2500);
    expect((await chain.repos.commissions.getLiveForLead(lead.id))?.id).toBe(replacement.id);
  });
});
