import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import { OfferService } from '@/src/services/OfferService';
import { seedChain, type SeededChain } from '@/tests/support/fixtures';

describe('OfferService', () => {
  let chain: SeededChain;
  let service: OfferService;

  beforeEach(async () => {
    chain = await seedChain();
    service = new OfferService(
      chain.repos.offers,
      chain.repos.campaigns,
      chain.repos.clients,
      chain.repos.products,
    );
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

  it('requires a client — an offer with nobody to deliver to has no purpose', async () => {
    await expect(
      service.create({
        clientId: '',
        offerCode: 'X1',
        name: 'X',
        destinationUrl: 'https://x.com',
        commissionAmount: 1,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('allows a standalone offer with NO product and NO campaign', async () => {
    // Decision 3: an admin may create an offer that belongs to no programme.
    const offer = await service.create({
      clientId: chain.clientId,
      offerCode: 'SOLO1',
      name: 'Standalone',
      destinationUrl: 'https://x.com',
      commissionAmount: 250,
    });

    expect(offer.campaignId).toBeUndefined();
    expect(offer.productId).toBeUndefined();
    expect(offer.clientId).toBe(chain.clientId);
    expect((await service.listUnassigned()).some((o) => o.id === offer.id)).toBe(true);
  });

  it('allows a product without a campaign, and a campaign without an explicit product', async () => {
    const withProduct = await service.create({
      clientId: chain.clientId,
      productId: chain.productId,
      offerCode: 'PRODONLY',
      name: 'Product only',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    });
    expect(withProduct.productId).toBe(chain.productId);
    expect(withProduct.campaignId).toBeUndefined();
    expect(await service.listByProduct(chain.productId)).toHaveLength(1);

    const withCampaign = await service.create({
      clientId: chain.clientId,
      campaignId: chain.campaignId,
      offerCode: 'CAMPONLY',
      name: 'Campaign only',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    });
    expect(withCampaign.campaignId).toBe(chain.campaignId);
    // Neither is in the unassigned bucket.
    expect(await service.listUnassigned()).toHaveLength(0);
  });

  it('rejects a product or campaign whose contradiction would corrupt reporting', async () => {
    const otherProduct = await chain.repos.products.create({
      slug: 'home-services-x',
      name: 'Home Services',
      status: 'planned',
    });

    // The campaign belongs to the Real Estate product; claiming Home Services would make
    // product-grouped and campaign-grouped reports disagree.
    await expect(
      service.create({
        clientId: chain.clientId,
        productId: otherProduct.id,
        campaignId: chain.campaignId,
        offerCode: 'MISMATCH',
        name: 'Mismatch',
        destinationUrl: 'https://x.com',
        commissionAmount: 1,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a campaign, product or client that does not exist', async () => {
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
      service.create({ ...base, productId: 'missing', clientId: chain.clientId }),
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
