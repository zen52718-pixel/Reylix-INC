import { describe, expect, it } from 'vitest';
import type { Lead } from '@/src/domain/types';
import { MemoryClickRepo } from '@/src/repositories/memory/MemoryClickRepo';
import { MemoryLeadRepo } from '@/src/repositories/memory/MemoryLeadRepo';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { MemoryPublisherRepo } from '@/src/repositories/memory/MemoryPublisherRepo';
import { MemoryReferralLinkRepo } from '@/src/repositories/memory/MemoryReferralLinkRepo';
import { PublisherPortalService } from '@/src/services/PublisherPortalService';

async function setup() {
  const publishers = new MemoryPublisherRepo();
  const offers = new MemoryOfferRepo();
  const leads = new MemoryLeadRepo();
  const clicks = new MemoryClickRepo();
  const referralLinks = new MemoryReferralLinkRepo();

  const publisher = await publishers.create({
    publisherCode: 'AHMED',
    fullName: 'Ahmed',
    email: 'a@example.com',
    phone: '1',
    status: 'active',
  });
  const other = await publishers.create({
    publisherCode: 'SARA',
    fullName: 'Sara',
    email: 's@example.com',
    phone: '2',
    status: 'active',
  });
  const offer = await offers.create({
    buyerId: 'buyer-1',
    offerCode: 'MVA1',
    name: 'MVA',
    destinationUrl: 'https://x.com',
    commissionAmount: 5000,
    currency: 'USD',
    isActive: true,
  });

  const service = new PublisherPortalService(
    { publishers, offers, leads, clicks, referralLinks },
    { redirectBaseUrl: 'https://go.reylix.com' },
  );
  return { service, publishers, offers, leads, clicks, referralLinks, publisher, other, offer };
}

async function seedLead(leads: MemoryLeadRepo, publisherId: string, patch: Partial<Lead>) {
  return leads.append({
    publisherId,
    offerId: 'o1',
    refCode: 'AHMED-MVA1',
    buyerId: 'buyer-1',
    attributionSource: 'param',
    status: 'new',
    commissionAmount: 0,
    capturedData: {},
    createdAt: new Date().toISOString(),
    ...patch,
  });
}

describe('PublisherPortalService.summary', () => {
  it('aggregates clicks, leads, approved, and commission earned/paid/unpaid', async () => {
    const { service, leads, clicks, publisher } = await setup();
    await clicks.append({
      refCode: 'AHMED-MVA1',
      publisherId: publisher.id,
      offerId: 'o1',
      clickedAt: new Date().toISOString(),
      dedupKey: 'k',
      isUnique: true,
    });
    await seedLead(leads, publisher.id, { status: 'new' });
    await seedLead(leads, publisher.id, { status: 'approved', commissionAmount: 5000 });
    await seedLead(leads, publisher.id, { status: 'paid', commissionAmount: 5000 });

    const s = await service.summary(publisher.id);
    expect(s.clicks).toBe(1);
    expect(s.leads).toBe(3);
    expect(s.approved).toBe(2); // approved + paid
    expect(s.commissionEarned).toBe(10000);
    expect(s.paid).toBe(5000);
    expect(s.unpaid).toBe(5000);
  });
});

describe('PublisherPortalService scoping', () => {
  it('returns only the requesting publisher’s leads', async () => {
    const { service, leads, publisher, other } = await setup();
    await seedLead(leads, publisher.id, {});
    await seedLead(leads, other.id, {});
    const mine = await service.leads(publisher.id);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.publisherId).toBe(publisher.id);
  });
});

describe('PublisherPortalService.offersWithLinks', () => {
  it('builds deterministic links and persists one referral row per offer (idempotent)', async () => {
    const { service, referralLinks, publisher } = await setup();
    const first = await service.offersWithLinks(publisher.id);
    expect(first[0]?.refCode).toBe('AHMED-MVA1');
    expect(first[0]?.link).toBe('https://go.reylix.com/r/AHMED-MVA1');

    await service.offersWithLinks(publisher.id); // second call must not duplicate
    expect(await referralLinks.listByPublisher(publisher.id)).toHaveLength(1);
  });

  it('links() joins persisted rows to offer names', async () => {
    const { service, publisher } = await setup();
    await service.offersWithLinks(publisher.id);
    const links = await service.links(publisher.id);
    expect(links[0]?.offerName).toBe('MVA');
  });
});

describe('PublisherPortalService.updateAccount', () => {
  it('updates only whitelisted profile/payout fields', async () => {
    const { service, publisher } = await setup();
    // Include protected fields to prove they are ignored by the whitelist.
    const sneaky = {
      city: 'Austin',
      payoutMethod: 'ach',
      status: 'suspended',
      publisherCode: 'HACK',
      email: 'evil@x.com',
    } as Parameters<typeof service.updateAccount>[1];
    const updated = await service.updateAccount(publisher.id, sneaky);
    expect(updated.city).toBe('Austin');
    expect(updated.payoutMethod).toBe('ach');
    expect(updated.status).toBe('active'); // unchanged
    expect(updated.publisherCode).toBe('AHMED'); // unchanged
    expect(updated.email).toBe('a@example.com'); // unchanged
  });
});
