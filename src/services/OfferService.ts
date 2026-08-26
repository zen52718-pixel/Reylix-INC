/**
 * OfferService — the commercial unit that binds a campaign (and through it a product) to
 * a client at a price.
 *
 * The client relationship lives HERE and nowhere higher: a Product must stay reusable
 * across every client, so an offer is the point where "this product, this client, this
 * price" is stated.
 *
 * Storage-agnostic: depends only on repository interfaces.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { CommissionModel, Offer } from '@/src/domain/types';
import { COMMISSION_MODELS, DEFAULT_CURRENCY } from '@/src/domain/types';
import type { CampaignRepo, ClientRepo, OfferRepo } from '@/src/repositories/interfaces';

export interface CreateOfferInput {
  campaignId: string;
  clientId: string;
  offerCode: string;
  name: string;
  destinationUrl: string;
  commissionAmount: number;
  commissionModel?: CommissionModel;
  description?: string;
  currency?: string;
  leadDedupWindowMinutes?: number;
  isActive?: boolean;
}

export type UpdateOfferInput = Partial<Omit<Offer, 'id' | 'createdAt'>>;

export class OfferService {
  constructor(
    private readonly offers: OfferRepo,
    private readonly campaigns?: CampaignRepo,
    private readonly clients?: ClientRepo,
  ) {}

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

  async listByClient(clientId: string): Promise<Offer[]> {
    return this.offers.listByClient(clientId);
  }

  async listByCampaign(campaignId: string): Promise<Offer[]> {
    return this.offers.listByCampaign(campaignId);
  }

  async create(input: CreateOfferInput): Promise<Offer> {
    const campaignId = requireField(input.campaignId, 'campaignId');
    const clientId = requireField(input.clientId, 'clientId');
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
    const commissionModel = input.commissionModel ?? 'flat';
    if (!COMMISSION_MODELS.includes(commissionModel)) {
      throw new ValidationError('commissionModel is not a recognised model', { commissionModel });
    }
    assertDedupWindow(input.leadDedupWindowMinutes);

    // Referential integrity is checked here as well as by the database foreign keys, so
    // the memory adapter refuses the same thing Postgres would.
    if (this.campaigns && !(await this.campaigns.getById(campaignId))) {
      throw new NotFoundError('Campaign ' + campaignId + ' not found', { campaignId });
    }
    if (this.clients && !(await this.clients.getById(clientId))) {
      throw new NotFoundError('Client ' + clientId + ' not found', { clientId });
    }
    if (await this.offers.getByCode(offerCode)) {
      throw new ConflictError('Offer code ' + offerCode + ' already exists', { offerCode });
    }

    return this.offers.create({
      campaignId,
      clientId,
      offerCode,
      name,
      destinationUrl,
      description: input.description,
      commissionModel,
      commissionAmount,
      currency: (input.currency ?? DEFAULT_CURRENCY).toUpperCase(),
      leadDedupWindowMinutes: input.leadDedupWindowMinutes,
      isActive: input.isActive ?? true,
    });
  }

  async update(id: string, patch: UpdateOfferInput): Promise<Offer> {
    const next: UpdateOfferInput = { ...patch };

    if (next.offerCode !== undefined) {
      next.offerCode = normalizeCode(next.offerCode);
      const clash = await this.offers.getByCode(next.offerCode);
      if (clash && clash.id !== id) {
        throw new ConflictError('Offer code ' + next.offerCode + ' already exists', {
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
    if (next.leadDedupWindowMinutes !== undefined) {
      assertDedupWindow(next.leadDedupWindowMinutes);
    }
    if (next.currency !== undefined) next.currency = next.currency.toUpperCase();

    return this.offers.update(id, next);
  }

  /** Convenience for activate/deactivate from offer management. */
  async setActive(id: string, isActive: boolean): Promise<Offer> {
    return this.offers.update(id, { isActive });
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
