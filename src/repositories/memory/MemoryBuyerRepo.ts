import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Buyer } from '@/src/domain/types';
import type { BuyerRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryBuyerRepo implements BuyerRepo {
  private readonly store = new Map<string, Buyer>();

  async getById(id: string): Promise<Buyer | null> {
    return this.store.get(id) ?? null;
  }

  async list(filter?: Partial<Buyer>): Promise<Buyer[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }

  async create(b: Omit<Buyer, 'id' | 'createdAt'>): Promise<Buyer> {
    const buyer: Buyer = { ...b, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(buyer.id, buyer);
    return buyer;
  }

  async update(id: string, patch: Partial<Buyer>): Promise<Buyer> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Buyer ${id} not found`);
    const updated: Buyer = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
