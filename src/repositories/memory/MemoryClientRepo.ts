import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Client } from '@/src/domain/types';
import type { ClientRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryClientRepo implements ClientRepo {
  private readonly store = new Map<string, Client>();

  async getById(id: string): Promise<Client | null> {
    return this.store.get(id) ?? null;
  }

  async list(filter?: Partial<Client>): Promise<Client[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }

  async create(c: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const client: Client = { ...c, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(client.id, client);
    return client;
  }

  async update(id: string, patch: Partial<Client>): Promise<Client> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Client ${id} not found`);
    const updated: Client = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
