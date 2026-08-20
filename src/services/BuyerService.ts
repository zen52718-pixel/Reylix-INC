/**
 * BuyerService — all buyer (advertiser) business logic. Storage-agnostic: depends only on
 * the BuyerRepo interface.
 *
 * Buyers are ADMIN-MANAGED in v1: there is no buyer login and no self-serve portal, so
 * every method here is reached through an admin-authenticated route. A buyer-facing role
 * is a later phase; nothing in this service assumes one exists.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Buyer, BuyerStatus } from '@/src/domain/types';
import type { BuyerRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CreateBuyerInput {
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status?: BuyerStatus;
  notes?: string;
}

export type UpdateBuyerInput = Partial<Omit<Buyer, 'id' | 'createdAt'>>;

export class BuyerService {
  constructor(
    private readonly buyers: BuyerRepo,
    private readonly audit?: AuditService,
  ) {}

  async getById(id: string): Promise<Buyer | null> {
    return this.buyers.getById(id);
  }

  async list(filter?: Partial<Buyer>): Promise<Buyer[]> {
    return this.buyers.list(filter);
  }

  /** Only buyers that can currently receive leads. */
  async listActive(): Promise<Buyer[]> {
    return this.buyers.list({ status: 'active' });
  }

  async create(input: CreateBuyerInput, actor?: string): Promise<Buyer> {
    const company = requireField(input.company, 'company');
    const contactName = requireField(input.contactName, 'contactName');
    const contactEmail = normalizeEmail(requireField(input.contactEmail, 'contactEmail'));
    if (!isEmail(contactEmail)) {
      throw new ValidationError('contactEmail is not a valid address', { contactEmail });
    }
    if (await this.findByCompany(company)) {
      throw new ConflictError('A buyer named ' + company + ' already exists', { company });
    }

    const buyer = await this.buyers.create({
      company,
      contactName,
      contactEmail,
      contactPhone: input.contactPhone?.trim() || undefined,
      status: input.status ?? 'active',
      notes: input.notes?.trim() || undefined,
    });
    if (actor) await this.audit?.log(actor, 'buyer', buyer.id, 'created', { company });
    return buyer;
  }

  async update(id: string, patch: UpdateBuyerInput, actor?: string): Promise<Buyer> {
    const existing = await this.buyers.getById(id);
    if (!existing) throw new NotFoundError('Buyer ' + id + ' not found');

    const next: UpdateBuyerInput = { ...patch };
    if (next.company !== undefined) {
      next.company = requireField(next.company, 'company');
      const clash = await this.findByCompany(next.company);
      if (clash && clash.id !== id) {
        throw new ConflictError('A buyer named ' + next.company + ' already exists', {
          company: next.company,
        });
      }
    }
    if (next.contactEmail !== undefined) {
      next.contactEmail = normalizeEmail(next.contactEmail);
      if (!isEmail(next.contactEmail)) {
        throw new ValidationError('contactEmail is not a valid address', {
          contactEmail: next.contactEmail,
        });
      }
    }

    const updated = await this.buyers.update(id, next);
    if (actor) await this.audit?.log(actor, 'buyer', id, 'updated', { patch: next });
    return updated;
  }

  /** Pause a buyer: their offers stop accepting new leads. Existing leads are untouched. */
  async setStatus(id: string, status: BuyerStatus, actor: string): Promise<Buyer> {
    const existing = await this.buyers.getById(id);
    if (!existing) throw new NotFoundError('Buyer ' + id + ' not found');
    const updated = await this.buyers.update(id, { status });
    await this.audit?.log(actor, 'buyer', id, 'status_changed', {
      from: existing.status,
      to: status,
    });
    return updated;
  }

  private async findByCompany(company: string): Promise<Buyer | null> {
    const all = await this.buyers.list();
    const target = company.trim().toLowerCase();
    return all.find((b) => b.company.trim().toLowerCase() === target) ?? null;
  }
}

function requireField(value: string | undefined, name: string): string {
  const v = (value ?? '').trim();
  if (!v) throw new ValidationError(name + ' is required', { field: name });
  return v;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
