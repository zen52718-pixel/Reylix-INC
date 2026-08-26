import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Offer } from '@/src/domain/types';
import type { OfferRepo } from '@/src/repositories/interfaces';

export class MemoryOfferRepo implements OfferRepo {
  private readonly store = new Map<string, Offer>();

  async getById(id: string): Promise<Offer | null> {
    return this.store.get(id) ?? null;
  }

  async getByCode(code: string): Promise<Offer | null> {
    const target = code.trim().toUpperCase();
    for (const o of this.store.values()) {
      if (o.offerCode.toUpperCase() === target) return o;
    }
    return null;
  }

  async list(): Promise<Offer[]> {
    return [...this.store.values()];
  }

  async listActive(): Promise<Offer[]> {
    return [...this.store.values()].filter((o) => o.isActive);
  }

  async listByClient(clientId: string): Promise<Offer[]> {
    return [...this.store.values()].filter((o) => o.clientId === clientId);
  }

  async listByCampaign(campaignId: string): Promise<Offer[]> {
    return [...this.store.values()].filter((o) => o.campaignId === campaignId);
  }

  async create(o: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer> {
    const offer: Offer = { ...o, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(offer.id, offer);
    return offer;
  }

  async update(id: string, patch: Partial<Offer>): Promise<Offer> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Offer ${id} not found`);
    const updated: Offer = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
