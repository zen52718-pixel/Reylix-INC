/**
 * Shared adapter contract test. ONE behavioural suite, run against EVERY adapter. This is
 * what guarantees the adapters behave identically, so flipping STORAGE_BACKEND is safe.
 *
 * The suite is storage-honest, which matters now that a real database is on the other
 * side: every test seeds its own Product → Campaign → Client → Offer chain so foreign
 * keys are satisfied, and assertions are scoped to those freshly created rows rather than
 * to global table counts.
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
import { seedChain } from '@/tests/support/fixtures';

const supabaseConfigured =
  process.env.RUN_SUPABASE_CONTRACT === '1' &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const ADAPTERS: Array<[string, () => RepositoryBundle]> = [['memory', createMemoryRepositories]];
if (supabaseConfigured) ADAPTERS.push(['supabase', createSupabaseRepositories]);

describe.each(ADAPTERS)('repository contract: %s', (_name, makeBundle) => {
  it('clients: create, get by id, update, filter by status', async () => {
    const repos = makeBundle();
    const { clientId } = await seedChain({ repos });

    const client = await repos.clients.getById(clientId);
    expect(client?.status).toBe('active');

    const paused = await repos.clients.update(clientId, { status: 'paused' });
    expect(paused.status).toBe('paused');
    expect((await repos.clients.list({ status: 'active' })).some((c) => c.id === clientId)).toBe(
      false,
    );
  });

  it('products: create, get by slug, and carry no client reference', async () => {
    const repos = makeBundle();
    const { productId } = await seedChain({ repos });

    const product = await repos.products.getById(productId);
    expect(product).not.toBeNull();
    expect((await repos.products.getBySlug(product!.slug))?.id).toBe(productId);
    // The property that makes a product reusable across clients.
    expect(Object.keys(product!)).not.toContain('clientId');
  });

  it('campaigns: belong to a product and list by it', async () => {
    const repos = makeBundle();
    const { productId, campaignId } = await seedChain({ repos });

    expect((await repos.campaigns.getById(campaignId))?.productId).toBe(productId);
    expect(await repos.campaigns.listByProduct(productId)).toHaveLength(1);
  });

  it('publishers: create, get by id/code (case-insensitive), by auth user, update', async () => {
    const repos = makeBundle();
    const { publisherId, publisherCode } = await seedChain({ repos });

    expect((await repos.publishers.getByCode(publisherCode.toLowerCase()))?.id).toBe(publisherId);

    const authUserId = randomUUID();
    await repos.publishers.update(publisherId, { authUserId });
    expect((await repos.publishers.getByAuthUserId(authUserId))?.id).toBe(publisherId);

    expect((await repos.publishers.update(publisherId, { status: 'suspended' })).status).toBe(
      'suspended',
    );
  });

  it('offers: identify their client and campaign, and listActive reflects deactivation', async () => {
    const repos = makeBundle();
    const { offerId, clientId, campaignId } = await seedChain({ repos });

    const offer = await repos.offers.getById(offerId);
    expect(offer?.clientId).toBe(clientId);
    expect(offer?.campaignId).toBe(campaignId);

    expect(await repos.offers.listByClient(clientId)).toHaveLength(1);
    expect(await repos.offers.listByCampaign(campaignId)).toHaveLength(1);
    expect((await repos.offers.listActive()).some((o) => o.id === offerId)).toBe(true);

    await repos.offers.update(offerId, { isActive: false });
    expect((await repos.offers.listActive()).some((o) => o.id === offerId)).toBe(false);
  });

  it('referralLinks: create, lookups by id, code and publisher+offer', async () => {
    const repos = makeBundle();
    const { publisherId, offerId, refCode } = await seedChain({ repos });

    const r = await repos.referralLinks.create({ publisherId, offerId, refCode });
    expect((await repos.referralLinks.getById(r.id))?.refCode).toBe(refCode);
    expect((await repos.referralLinks.getByCode(refCode.toLowerCase()))?.id).toBe(r.id);
    expect((await repos.referralLinks.getByPublisherAndOffer(publisherId, offerId))?.id).toBe(r.id);
    expect(await repos.referralLinks.listByPublisher(publisherId)).toHaveLength(1);
  });

  it('clicks: append returns the row, listByPublisher, recentDedup honours the window', async () => {
    const repos = makeBundle();
    const chain = await seedChain({ repos });
    const dedupKey = `key-${chain.tag}`;

    const click = await repos.clicks.append({
      refCode: chain.refCode,
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clickedAt: new Date().toISOString(),
      dedupKey,
      isUnique: true,
    });
    expect(click.id).toBeTruthy();

    expect(await repos.clicks.listByPublisher(chain.publisherId)).toHaveLength(1);
    expect(await repos.clicks.recentDedup(dedupKey, 60_000)).toBe(true);
    expect(await repos.clicks.recentDedup(`absent-${chain.tag}`, 60_000)).toBe(false);
  });

  it('leads: append, get, list by publisher / client / campaign, updateStatus', async () => {
    const repos = makeBundle();
    const chain = await seedChain({ repos });

    const lead = await repos.leads.append({
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: chain.refCode,
      status: 'new',
      capturedData: { name: 'Sara' },
      createdAt: new Date().toISOString(),
    });

    expect((await repos.leads.getById(lead.id))?.capturedData).toEqual({ name: 'Sara' });
    expect(await repos.leads.list({ publisherId: chain.publisherId })).toHaveLength(1);
    expect(await repos.leads.list({ clientId: chain.clientId })).toHaveLength(1);
    expect(await repos.leads.list({ campaignId: chain.campaignId })).toHaveLength(1);

    // approvedAt is not optional in practice: the schema's leads_approved_at_required
    // constraint rejects an approved lead without one.
    const approved = await repos.leads.updateStatus(lead.id, 'approved', {
      approvedAt: new Date().toISOString(),
    });
    expect(approved.status).toBe('approved');
  });

  it('leads: findRecentByDedupKey respects the window', async () => {
    const repos = makeBundle();
    const chain = await seedChain({ repos });
    const dedupKey = `consumer-${chain.tag}`;

    await repos.leads.append({
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: chain.refCode,
      status: 'new',
      capturedData: {},
      dedupKey,
      createdAt: new Date().toISOString(),
    });

    expect(await repos.leads.findRecentByDedupKey(dedupKey, 60_000)).not.toBeNull();
    expect(await repos.leads.findRecentByDedupKey(`absent-${chain.tag}`, 60_000)).toBeNull();
  });

  it('leadAttributions: append, current, supersede, and one live row per lead', async () => {
    const repos = makeBundle();
    const chain = await seedChain({ repos });
    const lead = await repos.leads.append({
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

    const first = await repos.leadAttributions.append({
      leadId: lead.id,
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      source: 'param',
      attributedAt: new Date().toISOString(),
    });

    expect((await repos.leadAttributions.getCurrentForLead(lead.id))?.id).toBe(first.id);

    await repos.leadAttributions.supersede(first.id, new Date().toISOString(), 'corrected');
    expect(await repos.leadAttributions.getCurrentForLead(lead.id)).toBeNull();
    // History is retained rather than overwritten.
    expect(await repos.leadAttributions.listByLead(lead.id)).toHaveLength(1);
  });

  it('commissions: create, live lookup, filter, and immutable amount', async () => {
    const repos = makeBundle();
    const chain = await seedChain({ repos });
    const lead = await repos.leads.append({
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

    const commission = await repos.commissions.create({
      leadId: lead.id,
      publisherId: chain.publisherId,
      offerId: chain.offerId,
      clientId: chain.clientId,
      amount: 5000,
      currency: 'USD',
      model: 'flat',
      status: 'payable',
      createdAt: new Date().toISOString(),
    });

    expect((await repos.commissions.getLiveForLead(lead.id))?.id).toBe(commission.id);
    expect(await repos.commissions.list({ publisherId: chain.publisherId })).toHaveLength(1);
    expect(await repos.commissions.list({ clientId: chain.clientId })).toHaveLength(1);

    // A correction is a void plus a new record, never an edit of the amount.
    const attempted = await repos.commissions.update(commission.id, { amount: 999999 });
    expect(attempted.amount).toBe(5000);
  });

  it('payouts: upsert is idempotent per (publisher, period), transition through states', async () => {
    const repos = makeBundle();
    const { publisherId } = await seedChain({ repos });

    const row = await repos.payouts.upsertPeriod({
      publisherId,
      periodLabel: '2026-05',
      leadCount: 1,
      totalCommission: 5000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await repos.payouts.upsertPeriod({
      publisherId,
      periodLabel: '2026-05',
      leadCount: 2,
      totalCommission: 10000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const forPublisher = await repos.payouts.list({ publisherId });
    expect(forPublisher).toHaveLength(1);
    expect(forPublisher[0]?.totalCommission).toBe(10000);

    expect((await repos.payouts.transition(row.id, 'approved')).status).toBe('approved');
    const failed = await repos.payouts.transition(row.id, 'failed', {
      failureReason: 'bank rejected',
    });
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('bank rejected');
  });

  it('audit + inquiries: append and list', async () => {
    const repos = makeBundle();
    const entityId = randomUUID();
    const email = `jane-${randomUUID().slice(0, 8)}@example.com`;

    await repos.audit.append({
      actor: 'admin@reylix.com',
      entity: 'lead',
      entityId,
      action: 'approved',
      detail: { amount: 5000 },
      occurredAt: new Date().toISOString(),
    });
    expect(await repos.audit.list({ entityId })).toHaveLength(1);

    const inquiry = await repos.inquiries.append({
      name: 'Jane',
      email,
      interestType: 'publisher',
      consentGranted: true,
      consentWording: 'I agree to be contacted.',
      consentAt: new Date().toISOString(),
      handled: false,
      createdAt: new Date().toISOString(),
    });
    expect(inquiry.consentGranted).toBe(true);
    expect(await repos.inquiries.list({ email })).toHaveLength(1);
  });
});
