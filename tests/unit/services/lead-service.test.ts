import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryClickRepo } from '@/src/repositories/memory/MemoryClickRepo';
import { MemoryLeadRepo } from '@/src/repositories/memory/MemoryLeadRepo';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { MemoryPublisherRepo } from '@/src/repositories/memory/MemoryPublisherRepo';
import { AttributionService } from '@/src/services/AttributionService';
import { LeadService } from '@/src/services/LeadService';
import type { AdminNotifier } from '@/src/services/notifications';

async function setup() {
  const publishers = new MemoryPublisherRepo();
  const offers = new MemoryOfferRepo();
  const leads = new MemoryLeadRepo();
  const clicks = new MemoryClickRepo();
  await publishers.create({
    publisherCode: 'AHMED',
    fullName: 'Ahmed',
    email: 'a@example.com',
    phone: '1',
    status: 'active',
  });
  await offers.create({
    buyerId: 'buyer-1',
    offerCode: 'MVA1',
    name: 'MVA',
    destinationUrl: 'https://lawcaseconnect.com',
    commissionAmount: 5000,
    currency: 'USD',
    isActive: true,
  });
  const attribution = new AttributionService(
    { publishers, offers, clicks },
    { dedupMinutes: 30, allowedRedirectHosts: [] },
  );
  const notifier: AdminNotifier = {
    notifyNewLead: vi.fn(async () => undefined),
    notifyNewContact: vi.fn(async () => undefined),
  };
  const service = new LeadService({ leads, offers, attribution, notifier });
  return { service, leads, notifier };
}

describe('LeadService.create — attribution priority', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  it('uses the param ref over the cookie ref (source=param)', async () => {
    const lead = await ctx.service.create({
      ref: 'AHMED-MVA1',
      cookieRef: 'AHMED-MVA1',
      fields: { name: 'Sara', phone: '(555) 123-4567' },
    });
    expect(lead.attributionSource).toBe('param');
    expect(lead.refCode).toBe('AHMED-MVA1');
    expect(lead.publisherId).not.toBeNull();
    expect(lead.offerId).not.toBeNull();
  });

  it('falls back to the cookie ref when no param ref (source=cookie)', async () => {
    const lead = await ctx.service.create({
      cookieRef: 'AHMED-MVA1',
      fields: { name: 'Sara' },
    });
    expect(lead.attributionSource).toBe('cookie');
    expect(lead.refCode).toBe('AHMED-MVA1');
  });

  it('is unattributed with no ref (source=none), but keeps offerHint offer', async () => {
    const lead = await ctx.service.create({
      offerHint: 'MVA1',
      fields: { name: 'Sara' },
    });
    expect(lead.attributionSource).toBe('none');
    expect(lead.publisherId).toBeNull();
    expect(lead.refCode).toBeNull();
    expect(lead.offerId).not.toBeNull(); // offer still recorded from the hint
  });

  it('falls through to cookie/none when the param ref is invalid', async () => {
    const lead = await ctx.service.create({
      ref: 'GHOST-NONE',
      cookieRef: 'AHMED-MVA1',
      fields: {},
    });
    expect(lead.attributionSource).toBe('cookie');
  });
});

describe('LeadService.create — record shape', () => {
  it('creates status=new, commission=0, stores captured_data, denormalizes name/phone, notifies', async () => {
    const { service, notifier } = await setup();
    const lead = await service.create({
      ref: 'AHMED-MVA1',
      fields: { name: '  Sara Ali ', phone: '(555) 123-4567', message: 'call me' },
    });

    expect(lead.status).toBe('new');
    expect(lead.commissionAmount).toBe(0);
    expect(lead.capturedData).toEqual({ name: '  Sara Ali ', phone: '(555) 123-4567', message: 'call me' });
    expect(lead.customerName).toBe('Sara Ali');
    expect(lead.customerPhone).toBe('+15551234567'); // normalized
    expect(notifier.notifyNewLead).toHaveBeenCalledOnce();
  });
});
