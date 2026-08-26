import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import { OfferService } from '@/src/services/OfferService';
import { seedChain, type SeededChain } from '@/tests/support/fixtures';

describe('OfferService', () => {
  let chain: SeededChain;
  let service: OfferService;

  beforeEach(async () => {
    chain = await seedChain();
    service = new OfferService(chain.repos.offers, chain.repos.campaigns, chain.repos.clients);
  });

  it('creates an offer bound to a campaign and a client, with USD + flat defaults', async () => {
    const offer = await service.create({
      campaignId: chain.campaignId,
      clientId: chain.clientId,
      offerCode: ' mva1 ',
      name: 'Motor Vehicle Accident',
      destinationUrl: 'https://lawcaseconnect.com',
      commissionAmount: 5000,
    });

    expect(offer.offerCode).toBe('MVA1');
    expect(offer.currency).toBe('USD');
    expect(offer.commissionModel).toBe('flat');
    expect(offer.isActive).toBe(true);
    // The client relationship lives on the offer, not on the product.
    expect(offer.clientId).toBe(chain.clientId);
    expect(offer.campaignId).toBe(chain.campaignId);
  });

  it('requires both a campaign and a client', async () => {
    const base = {
      offerCode: 'X1',
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    };
    await expect(
      service.create({ ...base, campaignId: '', clientId: chain.clientId }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({ ...base, campaignId: chain.campaignId, clientId: '' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a campaign or client that does not exist', async () => {
    const base = {
      offerCode: 'X2',
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    };
    await expect(
      service.create({ ...base, campaignId: 'missing', clientId: chain.clientId }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.create({ ...base, campaignId: chain.campaignId, clientId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a duplicate offer code', async () => {
    const base = {
      campaignId: chain.campaignId,
      clientId: chain.clientId,
      offerCode: 'DUP1',
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    };
    await service.create(base);
    await expect(service.create(base)).rejects.toBeInstanceOf(ConflictError);
  });

  it('validates URL, commission and dedup window', async () => {
    const base = {
      campaignId: chain.campaignId,
      clientId: chain.clientId,
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    };
    await expect(
      service.create({ ...base, offerCode: 'A', destinationUrl: 'not-a-url' }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({ ...base, offerCode: 'B', commissionAmount: -5 }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({ ...base, offerCode: 'C', leadDedupWindowMinutes: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({ ...base, offerCode: 'D', leadDedupWindowMinutes: 1.5 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('stores a configured dedup window and leaves it unset otherwise', async () => {
    const configured = await service.create({
      campaignId: chain.campaignId,
      clientId: chain.clientId,
      offerCode: 'CFG1',
      name: 'Configured',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
      leadDedupWindowMinutes: 43200,
    });
    expect(configured.leadDedupWindowMinutes).toBe(43200);

    // No business default is invented when the admin does not set one.
    const unset = await service.create({
      campaignId: chain.campaignId,
      clientId: chain.clientId,
      offerCode: 'CFG2',
      name: 'Unset',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    });
    expect(unset.leadDedupWindowMinutes).toBeUndefined();
  });

  it('listActive reflects setActive toggles', async () => {
    const offer = await service.create({
      campaignId: chain.campaignId,
      clientId: chain.clientId,
      offerCode: 'TOG1',
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    });
    await service.setActive(offer.id, false);
    expect((await service.listActive()).some((o) => o.id === offer.id)).toBe(false);
  });
});
