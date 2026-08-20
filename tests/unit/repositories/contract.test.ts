/**
 * Shared adapter contract test. ONE behavioral suite, run against EVERY adapter. This is
 * what guarantees the adapters behave identically, so flipping STORAGE_BACKEND is safe.
 *
 * The suite is written to be storage-honest, which matters now that a real database is on
 * the other side:
 *  - every test seeds its own buyer -> publisher -> offer chain, so foreign keys are
 *    satisfied and no test depends on ids another test invented;
 *  - assertions are scoped to those freshly created rows rather than global table counts,
 *    so a shared database with pre-existing data does not produce false failures.
 *
 * The Supabase adapter joins the run only when a database is configured (set
 * RUN_SUPABASE_CONTRACT=1 with the Supabase env vars, pointed at a disposable project).
 * Without it, the suite still fully covers the Memory adapter.
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { createMemoryRepositories } from '@/src/repositories/memory';
import { createSupabaseRepositories } from '@/src/repositories/supabase';

const supabaseConfigured =
  process.env.RUN_SUPABASE_CONTRACT === '1' &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const ADAPTERS: Array<[string, () => RepositoryBundle]> = [['memory', createMemoryRepositories]];
if (supabaseConfigured) ADAPTERS.push(['supabase', createSupabaseRepositories]);

/** A fresh, uniquely-tagged buyer/publisher/offer chain for one test. */
async function seed(repos: RepositoryBundle) {
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const buyer = await repos.buyers.create({
    company: `Contract Buyer ${tag}`,
    contactName: 'QA Contact',
    contactEmail: `buyer-${tag}@example.com`,
    status: 'active',
  });
  const publisher = await repos.publishers.create({
    publisherCode: `QA${tag}`,
    fullName: 'QA Publisher',
    email: `pub-${tag}@example.com`,
    phone: '+15551234567',
    status: 'pending',
  });
  const offer = await repos.offers.create({
    buyerId: buyer.id,
    offerCode: `OF${tag}`,
    name: 'QA Offer',
    destinationUrl: 'https://example.com',
    commissionAmount: 5000,
    currency: 'USD',
    isActive: true,
  });
  return { tag, buyer, publisher, offer };
}

describe.each(ADAPTERS)('repository contract: %s', (_name, makeBundle) => {
  it('buyers: create, get by id, update, filter by status', async () => {
    const repos = makeBundle();
    const { buyer } = await seed(repos);

    expect((await repos.buyers.getById(buyer.id))?.contactEmail).toBe(buyer.contactEmail);
    const paused = await repos.buyers.update(buyer.id, { status: 'paused' });
    expect(paused.status).toBe('paused');
    const active = await repos.buyers.list({ status: 'active' });
    expect(active.some((b) => b.id === buyer.id)).toBe(false);
  });

  it('publishers: create, get by id/code (case-insensitive), by auth user, update', async () => {
    const repos = makeBundle();
    const { publisher, tag } = await seed(repos);

    expect((await repos.publishers.getById(publisher.id))?.email).toBe(publisher.email);
    expect((await repos.publishers.getByCode(`qa${tag}`))?.id).toBe(publisher.id);

    const authUserId = randomUUID();
    await repos.publishers.update(publisher.id, { authUserId });
    expect((await repos.publishers.getByAuthUserId(authUserId))?.id).toBe(publisher.id);

    const updated = await repos.publishers.update(publisher.id, { status: 'active' });
    expect(updated.status).toBe('active');
  });

  it('offers: belong to a buyer, listActive reflects deactivation', async () => {
    const repos = makeBundle();
    const { buyer, offer } = await seed(repos);

    expect(await repos.offers.listByBuyer(buyer.id)).toHaveLength(1);
    expect((await repos.offers.listActive()).some((o) => o.id === offer.id)).toBe(true);

    await repos.offers.update(offer.id, { isActive: false });
    expect((await repos.offers.listActive()).some((o) => o.id === offer.id)).toBe(false);
  });

  it('referralLinks: create, lookups by code and by publisher+offer', async () => {
    const repos = makeBundle();
    const { publisher, offer, tag } = await seed(repos);
    const refCode = `QA${tag}-OF${tag}`;

    const r = await repos.referralLinks.create({
      publisherId: publisher.id,
      offerId: offer.id,
      refCode,
    });
    expect((await repos.referralLinks.getByCode(refCode.toLowerCase()))?.id).toBe(r.id);
    expect((await repos.referralLinks.getByPublisherAndOffer(publisher.id, offer.id))?.id).toBe(
      r.id,
    );
    expect(await repos.referralLinks.listByPublisher(publisher.id)).toHaveLength(1);
  });

  it('clicks: append, listByPublisher, recentDedup honours the window', async () => {
    const repos = makeBundle();
    const { publisher, offer, tag } = await seed(repos);
    const dedupKey = `key-${tag}`;

    await repos.clicks.append({
      refCode: `QA${tag}-OF${tag}`,
      publisherId: publisher.id,
      offerId: offer.id,
      clickedAt: new Date().toISOString(),
      dedupKey,
      isUnique: true,
    });

    expect(await repos.clicks.listByPublisher(publisher.id)).toHaveLength(1);
    expect(await repos.clicks.recentDedup(dedupKey, 60_000)).toBe(true);
    expect(await repos.clicks.recentDedup(`absent-${tag}`, 60_000)).toBe(false);
  });

  it('leads: append, get, list by publisher and by buyer, updateStatus locks commission', async () => {
    const repos = makeBundle();
    const { buyer, publisher, offer, tag } = await seed(repos);

    const lead = await repos.leads.append({
      publisherId: publisher.id,
      offerId: offer.id,
      buyerId: buyer.id,
      refCode: `QA${tag}-OF${tag}`,
      attributionSource: 'param',
      status: 'new',
      commissionAmount: 0,
      capturedData: { name: 'Sara' },
      createdAt: new Date().toISOString(),
    });

    expect((await repos.leads.getById(lead.id))?.capturedData).toEqual({ name: 'Sara' });
    expect(await repos.leads.list({ publisherId: publisher.id })).toHaveLength(1);
    expect(await repos.leads.list({ buyerId: buyer.id })).toHaveLength(1);

    // approvedAt is not optional in practice: the schema's leads_approved_at_required
    // constraint rejects an approved lead without one.
    const approved = await repos.leads.updateStatus(lead.id, 'approved', {
      commissionAmount: 5000,
      approvedAt: new Date().toISOString(),
    });
    expect(approved.status).toBe('approved');
    expect(approved.commissionAmount).toBe(5000);
  });

  it('payouts: upsert is idempotent per (publisher, period), markPaid', async () => {
    const repos = makeBundle();
    const { publisher } = await seed(repos);

    const row = await repos.payouts.upsertPeriod({
      publisherId: publisher.id,
      periodLabel: '2026-05',
      leadCount: 1,
      totalCommission: 5000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await repos.payouts.upsertPeriod({
      publisherId: publisher.id,
      periodLabel: '2026-05',
      leadCount: 2,
      totalCommission: 10000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const forPublisher = await repos.payouts.list({ publisherId: publisher.id });
    expect(forPublisher).toHaveLength(1);
    expect(forPublisher[0]?.totalCommission).toBe(10000);
    expect((await repos.payouts.markPaid(row.id)).status).toBe('paid');
  });

  it('audit + contacts: append and list', async () => {
    const repos = makeBundle();
    const entityId = randomUUID();
    const email = `jane-${randomUUID().slice(0, 8)}@example.com`;

    await repos.audit.append({
      actor: 'admin@reylix.com',
      entity: 'lead',
      entityId,
      action: 'approved',
      detail: { commissionAmount: 5000 },
      occurredAt: new Date().toISOString(),
    });
    expect(await repos.audit.list({ entityId })).toHaveLength(1);

    await repos.contacts.append({
      name: 'Jane',
      email,
      interestType: 'publisher',
      handled: false,
      createdAt: new Date().toISOString(),
    });
    expect(await repos.contacts.list({ email })).toHaveLength(1);
  });
});
