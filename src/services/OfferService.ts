/**
 * OfferService (Blueprint Sprint 1) — all offer business logic. Storage-agnostic:
 * depends only on the OfferRepo interface. Enforces unique offer_code, defaults currency
 * to USD and new offers to active, validates a non-negative flat commission, and
 * requires every offer to name the buyer that owns it.
 */
import { ConflictError, ValidationError } from '@/src/domain/errors';
import type { Offer } from '@/src/domain/types';
import type { OfferRepo } from '@/src/repositories/interfaces';

export interface CreateOfferInput {
  buyerId: string;
  offerCode: string;
  name: string;
  destinationUrl: string;
  commissionAmount: number;
  description?: string;
  category?: string;
  currency?: string;
  isActive?: boolean;
}

export type UpdateOfferInput = Partial<Omit<Offer, 'id' | 'createdAt'>>;

export class OfferService {
  constructor(private readonly offers: OfferRepo) {}

  async getById(id: string): Promise<Offer | null> {
    return this.offers.getById(id);
  }

  async getByCode(code: string): Promise<Offer | null> {
    return this.offers.getByCode(code);
  }

  async list(): Promise<Offer[]> {
    return this.offers.list();
  }

  async listActive(): Promise<Offer[]> {
    return this.offers.listActive();
  }

  async listByBuyer(buyerId: string): Promise<Offer[]> {
    return this.offers.listByBuyer(buyerId);
  }

  async create(input: CreateOfferInput): Promise<Offer> {
    const buyerId = requireField(input.buyerId, 'buyerId');
    const offerCode = normalizeCode(requireField(input.offerCode, 'offerCode'));
    const name = requireField(input.name, 'name');
    const destinationUrl = requireField(input.destinationUrl, 'destinationUrl');
    if (!isHttpUrl(destinationUrl)) {
      throw new ValidationError('destinationUrl must be a valid http(s) URL', { destinationUrl });
    }
    const commissionAmount = input.commissionAmount ?? 0;
    if (!Number.isFinite(commissionAmount) || commissionAmount < 0) {
      throw new ValidationError('commissionAmount must be a non-negative number', {
        commissionAmount,
      });
    }

    if (await this.offers.getByCode(offerCode)) {
      throw new ConflictError(`Offer code ${offerCode} already exists`, { offerCode });
    }

    return this.offers.create({
      buyerId,
      offerCode,
      name,
      destinationUrl,
      category: input.category,
      description: input.description,
      commissionAmount,
      currency: (input.currency ?? 'USD').toUpperCase(),
      isActive: input.isActive ?? true,
    });
  }

  async update(id: string, patch: UpdateOfferInput): Promise<Offer> {
    const next: UpdateOfferInput = { ...patch };

    if (next.offerCode !== undefined) {
      next.offerCode = normalizeCode(next.offerCode);
      const clash = await this.offers.getByCode(next.offerCode);
      if (clash && clash.id !== id) {
        throw new ConflictError(`Offer code ${next.offerCode} already exists`, {
          offerCode: next.offerCode,
        });
      }
    }
    if (next.destinationUrl !== undefined && !isHttpUrl(next.destinationUrl)) {
      throw new ValidationError('destinationUrl must be a valid http(s) URL', {
        destinationUrl: next.destinationUrl,
      });
    }
    if (
      next.commissionAmount !== undefined &&
      (!Number.isFinite(next.commissionAmount) || next.commissionAmount < 0)
    ) {
      throw new ValidationError('commissionAmount must be a non-negative number', {
        commissionAmount: next.commissionAmount,
      });
    }
    if (next.currency !== undefined) next.currency = next.currency.toUpperCase();

    return this.offers.update(id, next);
  }

  /** Convenience for activate/deactivate from offer management. */
  async setActive(id: string, isActive: boolean): Promise<Offer> {
    return this.offers.update(id, { isActive });
  }
}

function requireField(value: string | undefined, name: string): string {
  const v = (value ?? '').trim();
  if (!v) throw new ValidationError(`${name} is required`, { field: name });
  return v;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
