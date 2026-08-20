import { describe, expect, it } from 'vitest';
import type { Offer, Publisher } from '@/src/domain/types';
import { MemoryClickRepo } from '@/src/repositories/memory/MemoryClickRepo';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { MemoryPublisherRepo } from '@/src/repositories/memory/MemoryPublisherRepo';
import { AttributionService } from '@/src/services/AttributionService';

async function setup() {
  const publishers = new MemoryPublisherRepo();
  const offers = new MemoryOfferRepo();
  const clicks = new MemoryClickRepo();
  const publisher = await publishers.create({
    publisherCode: 'AHMED',
    fullName: 'Ahmed',
    email: 'a@example.com',
    phone: '1',
    status: 'active',
  });
  const offer = await offers.create({
    buyerId: 'buyer-1',
    offerCode: 'MVA1',
    name: 'MVA',
    destinationUrl: 'https://lawcaseconnect.com/intake',
    commissionAmount: 5000,
    currency: 'USD',
    isActive: true,
  });
  const service = new AttributionService(
    { publishers, offers, clicks },
    { dedupMinutes: 30, allowedRedirectHosts: ['lawcaseconnect.com', 'reylix.com'] },
  );
  return { service, publishers, offers, clicks, publisher, offer };
}

describe('AttributionService.resolve', () => {
  it('resolves a valid ref to active publisher + offer', async () => {
    const { service, publisher, offer } = await setup();
    const result = await service.resolve('ahmed-mva1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refCode).toBe('AHMED-MVA1');
      expect(result.publisher.id).toBe(publisher.id);
      expect(result.offer.id).toBe(offer.id);
    }
  });

  it.each([
    ['malformed', 'no-hyphen-here-but-actually', 'unknown_publisher'],
    ['no offer part', 'AHMED-', 'malformed_ref'],
    ['unknown publisher', 'NOBODY-MVA1', 'unknown_publisher'],
    ['unknown offer', 'AHMED-ZZZ', 'unknown_offer'],
  ])('fails for %s', async (_label, ref, expectedReason) => {
    const { service } = await setup();
    const result = await service.resolve(ref);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(expectedReason);
  });

  it('rejects a suspended publisher and an inactive offer', async () => {
    const { service, publishers, offers, publisher, offer } = await setup();
    await publishers.update(publisher.id, { status: 'suspended' });
    let result = await service.resolve('AHMED-MVA1');
    expect(result.ok ? null : result.reason).toBe('publisher_suspended');

    await publishers.update(publisher.id, { status: 'active' });
    await offers.update(offer.id, { isActive: false });
    result = await service.resolve('AHMED-MVA1');
    expect(result.ok ? null : result.reason).toBe('offer_inactive');
  });
});

describe('AttributionService dedup + click recording', () => {
  it('marks the first click unique and a repeat within the window non-unique', async () => {
    const { service, clicks, publisher, offer } = await setup();
    const resolved = { refCode: 'AHMED-MVA1', publisher: publisher as Publisher, offer: offer as Offer };
    const ctx = { ip: '1.2.3.4', userAgent: 'UA/1.0' };

    await service.recordClick(resolved, ctx);
    await service.recordClick(resolved, ctx);

    const rows = await clicks.listByPublisher(publisher.id);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.isUnique).toBe(true);
    expect(rows[1]?.isUnique).toBe(false);
  });

  it('treats a different visitor as a distinct unique click', async () => {
    const { service, clicks, publisher, offer } = await setup();
    const resolved = { refCode: 'AHMED-MVA1', publisher: publisher as Publisher, offer: offer as Offer };
    await service.recordClick(resolved, { ip: '1.1.1.1', userAgent: 'UA/1.0' });
    await service.recordClick(resolved, { ip: '2.2.2.2', userAgent: 'UA/1.0' });
    const rows = await clicks.listByPublisher(publisher.id);
    expect(rows.every((c) => c.isUnique)).toBe(true);
  });

  it('dedup key is stable for the same ref+ip+ua and differs across links', async () => {
    const { service } = await setup();
    const a = service.computeDedupKey('AHMED-MVA1', '1.2.3.4', 'UA');
    const b = service.computeDedupKey('AHMED-MVA1', '1.2.3.4', 'UA');
    const c = service.computeDedupKey('AHMED-OTHER', '1.2.3.4', 'UA');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('AttributionService.buildDestinationUrl', () => {
  it('appends ?ref to the offer destination', async () => {
    const { service, offer } = await setup();
    const { url, toRejected } = service.buildDestinationUrl(offer as Offer, 'AHMED-MVA1');
    expect(url).toBe('https://lawcaseconnect.com/intake?ref=AHMED-MVA1');
    expect(toRejected).toBe(false);
  });

  it('honors an allowlisted ?to= override', async () => {
    const { service, offer } = await setup();
    const { url, toRejected } = service.buildDestinationUrl(
      offer as Offer,
      'AHMED-MVA1',
      'https://reylix.com/landing',
    );
    expect(url).toBe('https://reylix.com/landing?ref=AHMED-MVA1');
    expect(toRejected).toBe(false);
  });

  it('rejects a non-allowlisted ?to= and falls back to the offer URL', async () => {
    const { service, offer } = await setup();
    const { url, toRejected } = service.buildDestinationUrl(
      offer as Offer,
      'AHMED-MVA1',
      'https://evil.example.com/phish',
    );
    expect(url).toBe('https://lawcaseconnect.com/intake?ref=AHMED-MVA1');
    expect(toRejected).toBe(true);
  });

  it('allows subdomains of allowlisted hosts but not lookalikes', async () => {
    const { service } = await setup();
    expect(service.isAllowedRedirect('https://app.lawcaseconnect.com')).toBe(true);
    expect(service.isAllowedRedirect('https://lawcaseconnect.com.evil.com')).toBe(false);
    expect(service.isAllowedRedirect('javascript:alert(1)')).toBe(false);
  });
});
