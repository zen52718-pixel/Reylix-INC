import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttributionService } from '@/src/services/AttributionService';
import { LeadService } from '@/src/services/LeadService';
import type { AdminNotifier } from '@/src/services/notifications';
import { seedChain, type SeededChain } from '@/tests/support/fixtures';

function build(chain: SeededChain) {
  const notifier: AdminNotifier = {
    notifyNewLead: vi.fn().mockResolvedValue(undefined),
    notifyNewInquiry: vi.fn().mockResolvedValue(undefined),
  };
  const attribution = new AttributionService(
    {
      publishers: chain.repos.publishers,
      offers: chain.repos.offers,
      clicks: chain.repos.clicks,
      leadAttributions: chain.repos.leadAttributions,
      leads: chain.repos.leads,
    },
    { dedupMinutes: 30, allowedRedirectHosts: ['example.com'] },
  );
  const service = new LeadService({
    leads: chain.repos.leads,
    offers: chain.repos.offers,
    campaigns: chain.repos.campaigns,
    attribution,
    notifier,
  });
  return { service, notifier, attribution };
}

describe('LeadService', () => {
  let chain: SeededChain;
  let svc: ReturnType<typeof build>;

  beforeEach(async () => {
    chain = await seedChain();
    svc = build(chain);
  });

  it('captures a consumer lead and denormalises the whole hierarchy', async () => {
    const { lead, attribution } = await svc.service.create({
      ref: chain.refCode,
      fields: { name: '  Sara Ali ', phone: '(555) 123-4567', email: 'Sara@Example.com' },
    });

    expect(lead.status).toBe('new');
    expect(lead.clientId).toBe(chain.clientId);
    expect(lead.productId).toBe(chain.productId);
    expect(lead.campaignId).toBe(chain.campaignId);
    expect(lead.offerId).toBe(chain.offerId);
    expect(lead.customerName).toBe('Sara Ali');
    expect(lead.customerPhone).toBe('+15551234567');
    expect(lead.customerEmail).toBe('sara@example.com');
    expect(lead.capturedData).toEqual({
      name: '  Sara Ali ',
      phone: '(555) 123-4567',
      email: 'Sara@Example.com',
    });

    // Attribution is a row, not a field on the lead.
    expect(attribution).not.toBeNull();
    expect(attribution?.source).toBe('param');
    expect(attribution?.publisherId).toBe(chain.publisherId);
    expect(svc.notifier.notifyNewLead).toHaveBeenCalledOnce();
  });

  it('prefers the param ref over the cookie ref', async () => {
    const other = await seedChain({ repos: chain.repos });
    const { attribution } = await svc.service.create({
      ref: chain.refCode,
      cookieRef: other.refCode,
      fields: { name: 'A' },
    });
    expect(attribution?.source).toBe('param');
    expect(attribution?.offerId).toBe(chain.offerId);
  });

  it('falls back to the cookie ref when the param is absent', async () => {
    const { attribution } = await svc.service.create({
      cookieRef: chain.refCode,
      fields: { name: 'A' },
    });
    expect(attribution?.source).toBe('cookie');
  });

  it('records an unattributed lead when nothing resolves', async () => {
    const { lead, attribution } = await svc.service.create({ fields: { name: 'Anon' } });
    expect(lead.publisherId).toBeNull();
    expect(lead.offerId).toBeNull();
    // No row at all, rather than a row claiming attribution to nobody.
    expect(attribution).toBeNull();
  });

  it('associates the offer from an offerHint without attributing a publisher', async () => {
    const { lead, attribution } = await svc.service.create({
      offerHint: chain.offerCode,
      fields: { name: 'Anon' },
    });
    expect(lead.offerId).toBe(chain.offerId);
    expect(lead.clientId).toBe(chain.clientId);
    expect(lead.publisherId).toBeNull();
    expect(attribution).toBeNull();
  });

  describe('consumer de-duplication', () => {
    it('does NOT de-duplicate when no window is configured', async () => {
      const first = await svc.service.create({
        ref: chain.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });
      const second = await svc.service.create({
        ref: chain.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });

      // No business default is invented, so both are attributed.
      expect(first.duplicateOfLeadId).toBeUndefined();
      expect(second.duplicateOfLeadId).toBeUndefined();
      expect(second.attribution).not.toBeNull();
    });

    it('leaves a duplicate unattributed when the OFFER configures a window', async () => {
      const configured = await seedChain({ leadDedupWindowMinutes: 60 });
      const s = build(configured);

      const first = await s.service.create({
        ref: configured.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });
      const second = await s.service.create({
        ref: configured.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });

      expect(first.attribution).not.toBeNull();
      expect(second.duplicateOfLeadId).toBe(first.lead.id);
      // The lead is still recorded — nothing is lost — but nobody can be paid for it.
      expect(second.lead.id).toBeTruthy();
      expect(second.attribution).toBeNull();
      expect(second.lead.publisherId).toBeNull();
    });

    it('inherits the window from the CAMPAIGN when the offer sets none', async () => {
      const configured = await seedChain({ campaignDedupWindowMinutes: 60 });
      const s = build(configured);

      await s.service.create({
        ref: configured.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });
      const second = await s.service.create({
        ref: configured.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });
      expect(second.duplicateOfLeadId).toBeTruthy();
    });

    it('treats a different consumer on the same offer as a new lead', async () => {
      const configured = await seedChain({ leadDedupWindowMinutes: 60 });
      const s = build(configured);

      await s.service.create({
        ref: configured.refCode,
        fields: { name: 'Sara', email: 'sara@example.com' },
      });
      const other = await s.service.create({
        ref: configured.refCode,
        fields: { name: 'Ben', email: 'ben@example.com' },
      });
      expect(other.duplicateOfLeadId).toBeUndefined();
      expect(other.attribution).not.toBeNull();
    });
  });
});
