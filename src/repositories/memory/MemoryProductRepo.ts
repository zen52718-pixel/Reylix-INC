import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Product } from '@/src/domain/types';
import type { ProductRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryProductRepo implements ProductRepo {
  private readonly store = new Map<string, Product>();

  async getById(id: string): Promise<Product | null> {
    return this.store.get(id) ?? null;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const target = slug.trim().toLowerCase();
    for (const p of this.store.values()) {
      if (p.slug.toLowerCase() === target) return p;
    }
    return null;
  }

  async list(filter?: Partial<Product>): Promise<Product[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }

  async create(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const product: Product = { ...p, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(product.id, product);
    return product;
  }

  async update(id: string, patch: Partial<Product>): Promise<Product> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Product ${id} not found`);
    const updated: Product = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
