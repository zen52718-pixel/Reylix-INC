import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/src/domain/errors';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { OfferService } from '@/src/services/OfferService';

describe('OfferService', () => {
  let service: OfferService;

  beforeEach(() => {
    service = new OfferService(new MemoryOfferRepo());
  });

  it('creates an offer with USD + active defaults and normalized code', async () => {
    const offer = await service.create({
      buyerId: 'buyer-1',
      offerCode: ' mva1 ',
      name: 'Motor Vehicle Accident',
      destinationUrl: 'https://lawcaseconnect.com',
      commissionAmount: 5000,
    });

    expect(offer.offerCode).toBe('MVA1');
    expect(offer.currency).toBe('USD');
    expect(offer.isActive).toBe(true);
  });

  it('rejects a duplicate offer code', async () => {
    const base = {
      buyerId: 'buyer-1',
      offerCode: 'MVA1',
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    };
    await service.create(base);
    await expect(service.create(base)).rejects.toBeInstanceOf(ConflictError);
  });

  it('validates URL and non-negative commission', async () => {
    await expect(
      service.create({
        buyerId: 'buyer-1',
        offerCode: 'A',
        name: 'A',
        destinationUrl: 'not-a-url',
        commissionAmount: 1,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      service.create({
        buyerId: 'buyer-1',
        offerCode: 'B',
        name: 'B',
        destinationUrl: 'https://x.com',
        commissionAmount: -5,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('listActive reflects setActive toggles', async () => {
    const offer = await service.create({
      buyerId: 'buyer-1',
      offerCode: 'MVA1',
      name: 'X',
      destinationUrl: 'https://x.com',
      commissionAmount: 1,
    });
    expect(await service.listActive()).toHaveLength(1);

    await service.setActive(offer.id, false);
    expect(await service.listActive()).toHaveLength(0);
    expect(await service.list()).toHaveLength(1);
  });
});
