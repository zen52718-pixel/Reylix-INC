/**
 * ProductService — the reusable Reylix acquisition products (Real Estate, Home Services,
 * Legal, Insurance).
 *
 * A Product is deliberately CLIENT-AGNOSTIC. Nothing in this service accepts or stores a
 * client reference, and that is the property that lets one product serve many clients
 * without being rebuilt per client. If a client id ever needs to appear here, the model
 * has gone wrong — the client belongs on the Offer.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Product, ProductStatus } from '@/src/domain/types';
import type { ProductRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CreateProductInput {
  slug: string;
  name: string;
  description?: string;
  status?: ProductStatus;
}

export type UpdateProductInput = Partial<Omit<Product, 'id' | 'createdAt'>>;

export class ProductService {
  constructor(
    private readonly products: ProductRepo,
    private readonly audit?: AuditService,
  ) {}

  async getById(id: string): Promise<Product | null> {
    return this.products.getById(id);
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return this.products.getBySlug(slug);
  }

  async list(filter?: Partial<Product>): Promise<Product[]> {
    return this.products.list(filter);
  }

  async listAvailable(): Promise<Product[]> {
    return this.products.list({ status: 'available' });
  }

  async create(input: CreateProductInput, actor?: string): Promise<Product> {
    const slug = normalizeSlug(requireField(input.slug, 'slug'));
    const name = requireField(input.name, 'name');
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new ValidationError('slug must be lowercase letters, digits and hyphens', { slug });
    }
    if (await this.products.getBySlug(slug)) {
      throw new ConflictError('Product ' + slug + ' already exists', { slug });
    }

    const product = await this.products.create({
      slug,
      name,
      description: input.description?.trim() || undefined,
      status: input.status ?? 'planned',
    });
    if (actor) await this.audit?.log(actor, 'product', product.id, 'created', { slug });
    return product;
  }

  async update(id: string, patch: UpdateProductInput, actor?: string): Promise<Product> {
    const existing = await this.products.getById(id);
    if (!existing) throw new NotFoundError('Product ' + id + ' not found');

    const next: UpdateProductInput = { ...patch };
    if (next.slug !== undefined) {
      next.slug = normalizeSlug(next.slug);
      const clash = await this.products.getBySlug(next.slug);
      if (clash && clash.id !== id) {
        throw new ConflictError('Product ' + next.slug + ' already exists', { slug: next.slug });
      }
    }

    const updated = await this.products.update(id, next);
    if (actor) await this.audit?.log(actor, 'product', id, 'updated', { patch: next });
    return updated;
  }

  async setStatus(id: string, status: ProductStatus, actor: string): Promise<Product> {
    const existing = await this.products.getById(id);
    if (!existing) throw new NotFoundError('Product ' + id + ' not found');
    const updated = await this.products.update(id, { status });
    await this.audit?.log(actor, 'product', id, 'status_changed', {
      from: existing.status,
      to: status,
    });
    return updated;
  }
}

function requireField(value: string | undefined, name: string): string {
  const v = (value ?? '').trim();
  if (!v) throw new ValidationError(name + ' is required', { field: name });
  return v;
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}
