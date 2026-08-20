import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Publisher } from '@/src/domain/types';
import type { PublisherRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryPublisherRepo implements PublisherRepo {
  private readonly store = new Map<string, Publisher>();

  async getById(id: string): Promise<Publisher | null> {
    return this.store.get(id) ?? null;
  }

  async getByCode(code: string): Promise<Publisher | null> {
    const target = code.trim().toUpperCase();
    for (const p of this.store.values()) {
      if (p.publisherCode.toUpperCase() === target) return p;
    }
    return null;
  }

  async getByAuthUserId(authUserId: string): Promise<Publisher | null> {
    for (const p of this.store.values()) {
      if (p.authUserId && p.authUserId === authUserId) return p;
    }
    return null;
  }

  async list(filter?: Partial<Publisher>): Promise<Publisher[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }

  async create(p: Omit<Publisher, 'id' | 'createdAt'>): Promise<Publisher> {
    const publisher: Publisher = { ...p, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(publisher.id, publisher);
    return publisher;
  }

  async update(id: string, patch: Partial<Publisher>): Promise<Publisher> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Publisher ${id} not found`);
    const updated: Publisher = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
