/**
 * CampaignService — acquisition programmes within a product, typically scoped to a
 * market (Real Estate → Rochester).
 *
 * A Campaign carries the default consumer de-duplication window for its offers. That
 * window is a COMMERCIAL term, so this service never invents one: it stores what an
 * admin configures and leaves it unset otherwise.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Campaign } from '@/src/domain/types';
import type { CampaignRepo, ProductRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CreateCampaignInput {
  productId: string;
  slug: string;
  name: string;
  market?: string;
  leadDedupWindowMinutes?: number;
  isActive?: boolean;
}

export type UpdateCampaignInput = Partial<Omit<Campaign, 'id' | 'createdAt' | 'productId'>>;

export class CampaignService {
  constructor(
    private readonly campaigns: CampaignRepo,
    private readonly products: ProductRepo,
    private readonly audit?: AuditService,
  ) {}

  async getById(id: string): Promise<Campaign | null> {
    return this.campaigns.getById(id);
  }

  async listByProduct(productId: string): Promise<Campaign[]> {
    return this.campaigns.listByProduct(productId);
  }

  async list(filter?: Partial<Campaign>): Promise<Campaign[]> {
    return this.campaigns.list(filter);
  }

  async create(input: CreateCampaignInput, actor?: string): Promise<Campaign> {
    const productId = requireField(input.productId, 'productId');
    const slug = normalizeSlug(requireField(input.slug, 'slug'));
    const name = requireField(input.name, 'name');

    const product = await this.products.getById(productId);
    if (!product) throw new NotFoundError('Product ' + productId + ' not found', { productId });

    const siblings = await this.campaigns.listByProduct(productId);
    if (siblings.some((c) => c.slug.toLowerCase() === slug)) {
      throw new ConflictError('Campaign ' + slug + ' already exists for this product', { slug });
    }

    assertDedupWindow(input.leadDedupWindowMinutes);

    const campaign = await this.campaigns.create({
      productId,
      slug,
      name,
      market: input.market?.trim() || undefined,
      leadDedupWindowMinutes: input.leadDedupWindowMinutes,
      isActive: input.isActive ?? true,
    });
    if (actor) await this.audit?.log(actor, 'campaign', campaign.id, 'created', { productId, slug });
    return campaign;
  }

  async update(id: string, patch: UpdateCampaignInput, actor?: string): Promise<Campaign> {
    const existing = await this.campaigns.getById(id);
    if (!existing) throw new NotFoundError('Campaign ' + id + ' not found');

    const next: UpdateCampaignInput = { ...patch };
    if (next.slug !== undefined) {
      next.slug = normalizeSlug(next.slug);
      const siblings = await this.campaigns.listByProduct(existing.productId);
      if (siblings.some((c) => c.id !== id && c.slug.toLowerCase() === next.slug)) {
        throw new ConflictError('Campaign ' + next.slug + ' already exists for this product', {
          slug: next.slug,
        });
      }
    }
    if (next.leadDedupWindowMinutes !== undefined) {
      assertDedupWindow(next.leadDedupWindowMinutes);
    }

    const updated = await this.campaigns.update(id, next);
    if (actor) await this.audit?.log(actor, 'campaign', id, 'updated', { patch: next });
    return updated;
  }

  async setActive(id: string, isActive: boolean): Promise<Campaign> {
    return this.campaigns.update(id, { isActive });
  }
}

function assertDedupWindow(minutes: number | undefined): void {
  if (minutes === undefined) return;
  if (!Number.isFinite(minutes) || minutes <= 0 || !Number.isInteger(minutes)) {
    throw new ValidationError('leadDedupWindowMinutes must be a positive whole number of minutes', {
      leadDedupWindowMinutes: minutes,
    });
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
