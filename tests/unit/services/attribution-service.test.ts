import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/src/domain/errors';
import { AttributionService } from '@/src/services/AttributionService';
import { seedChain, type SeededChain } from '@/tests/support/fixtures';

function build(chain: SeededChain) {
  return new AttributionService(
    {
      publishers: chain.repos.publishers,
      offers: chain.repos.offers,
      clicks: chain.repos.clicks,
      leadAttributions: chain.repos.leadAttributions,
      leads: chain.repos.leads,
    },
    { dedupMinutes: 30, allowedRedirectHosts: ['lawcaseconnect.com', 'reylix.com'] },
  );
}

async function newLead(chain: SeededChain) {
  return chain.repos.leads.append({
    publisherId: null,
    offerId: chain.offerId,
    clientId: chain.clientId,
    productId: chain.productId,
    campaignId: chain.campaignId,
    refCode: null,
    status: 'new',
    capturedData: {},
    createdAt: new Date().toISOString(),
  });
}

describe('AttributionService', () => {
  let chain: SeededChain;
  let service: AttributionService;

  beforeEach(async () => {
    chain = await seedChain();
    service = build(chain);
  });

  describe('resolve', () => {
    it('resolves a valid ref to publisher and offer', async () => {
      const r = await service.resolve(chain.refCode);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.publisher.id).toBe(chain.publisherId);
        expect(r.offer.id).toBe(chain.offerId);
      }
    });

    it('reports why a ref failed', async () => {
      expect(await service.resolve('nonsense')).toMatchObject({ reason: 'malformed_ref' });
      expect(await service.resolve('NOPE-' + chain.offerCode)).toMatchObject({
        reason: 'unknown_publisher',
      });
      expect(await service.resolve(chain.publisherCode + '-NOPE')).toMatchObject({
        reason: 'unknown_offer',
      });

      await chain.repos.offers.update(chain.offerId, { isActive: false });
      expect(await service.resolve(chain.refCode)).toMatchObject({ reason: 'offer_inactive' });
    });

    it('refuses a suspended publisher', async () => {
      await chain.repos.publishers.update(chain.publisherId, { status: 'suspended' });
      expect(await service.resolve(chain.refCode)).toMatchObject({ reason: 'publisher_suspended' });
    });
  });

  describe('clicks', () => {
    it('marks a repeat click inside the window as not unique', async () => {
      const r = await service.resolve(chain.refCode);
      if (!r.ok) throw new Error('expected resolve to succeed');

      const first = await service.recordClick(r, { ip: '1.1.1.1', userAgent: 'UA' });
      const second = await service.recordClick(r, { ip: '1.1.1.1', userAgent: 'UA' });
      expect(first.isUnique).toBe(true);
      expect(second.isUnique).toBe(false);
    });

    it('scopes the dedup key to the link, so different links do not collide', () => {
      const a = service.computeDedupKey('A-1', '1.1.1.1', 'UA');
      const b = service.computeDedupKey('A-2', '1.1.1.1', 'UA');
      expect(a).not.toBe(b);
    });
  });

  describe('attribution rows', () => {
    it('records credit once and refuses a second live attribution', async () => {
      const lead = await newLead(chain);
      const input = {
        leadId: lead.id,
        publisherId: chain.publisherId,
        offerId: chain.offerId,
        clientId: chain.clientId,
        source: 'param' as const,
      };

      const created = await service.attribute(input);
      expect((await service.currentAttribution(lead.id))?.id).toBe(created.id);
      await expect(service.attribute(input)).rejects.toBeInstanceOf(ConflictError);
    });

    it('requires an actor for manual attribution', async () => {
      const lead = await newLead(chain);
      await expect(
        service.attribute({
          leadId: lead.id,
          publisherId: chain.publisherId,
          offerId: chain.offerId,
          clientId: chain.clientId,
          source: 'manual',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('re-attribution supersedes rather than overwrites, preserving the history', async () => {
      const lead = await newLead(chain);
      const original = await service.attribute({
        leadId: lead.id,
        publisherId: chain.publisherId,
        offerId: chain.offerId,
        clientId: chain.clientId,
        source: 'param',
      });

      const other = await chain.repos.publishers.create({
        publisherCode: 'OTHER1',
        fullName: 'Other',
        email: 'other@example.com',
        phone: '+15550000000',
        status: 'active',
      });

      const moved = await service.reattribute(
        lead.id,
        other.id,
        'admin@reylix.com',
        'wrong publisher credited',
      );

      expect(moved.publisherId).toBe(other.id);
      expect(moved.source).toBe('manual');
      expect((await service.currentAttribution(lead.id))?.id).toBe(moved.id);

      // The original decision is still on file — this is what answers a dispute.
      const history = await service.attributionHistory(lead.id);
      expect(history).toHaveLength(2);
      expect(history.find((h) => h.id === original.id)?.supersededAt).toBeTruthy();

      // The lead's denormalized publisher follows.
      expect((await chain.repos.leads.getById(lead.id))?.publisherId).toBe(other.id);
    });

    it('requires a reason to re-attribute', async () => {
      const lead = await newLead(chain);
      await expect(
        service.reattribute(lead.id, chain.publisherId, 'admin', '   '),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('redirects', () => {
    it('appends the ref to the offer destination', async () => {
      const offer = await chain.repos.offers.getById(chain.offerId);
      const { url } = service.buildDestinationUrl(offer!, chain.refCode);
      expect(url).toBe(`https://example.com/?ref=${chain.refCode}`);
    });

    it('rejects a non-allowlisted override', async () => {
      const offer = await chain.repos.offers.getById(chain.offerId);
      const { url, toRejected } = service.buildDestinationUrl(
        offer!,
        chain.refCode,
        'https://evil.test/landing',
      );
      expect(toRejected).toBe(true);
      expect(url.startsWith('https://example.com')).toBe(true);
    });

    it('accepts an allowlisted override', async () => {
      const offer = await chain.repos.offers.getById(chain.offerId);
      const { url, toRejected } = service.buildDestinationUrl(
        offer!,
        chain.refCode,
        'https://lawcaseconnect.com/landing',
      );
      expect(toRejected).toBe(false);
      expect(url).toBe(`https://lawcaseconnect.com/landing?ref=${chain.refCode}`);
    });
  });
});
