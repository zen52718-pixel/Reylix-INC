import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Campaign } from '@/src/domain/types';
import type { CampaignRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryCampaignRepo implements CampaignRepo {
  private readonly store = new Map<string, Campaign>();

  async getById(id: string): Promise<Campaign | null> {
    return this.store.get(id) ?? null;
  }

  async listByProduct(productId: string): Promise<Campaign[]> {
    return [...this.store.values()].filter((c) => c.productId === productId);
  }

  async list(filter?: Partial<Campaign>): Promise<Campaign[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }

  async create(c: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
    const campaign: Campaign = { ...c, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(campaign.id, campaign);
    return campaign;
  }

  async update(id: string, patch: Partial<Campaign>): Promise<Campaign> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Campaign ${id} not found`);
    const updated: Campaign = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
