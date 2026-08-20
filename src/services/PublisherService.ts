/**
 * PublisherService (Blueprint Sprint 1) — all publisher business logic. Storage-agnostic:
 * depends only on the PublisherRepo interface. Enforces unique publisher_code and email
 * (a service-layer guarantee that mirrors the unique indexes in the Supabase schema).
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { PayoutMethod, Publisher, PublisherStatus } from '@/src/domain/types';
import type { PublisherRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CreatePublisherInput {
  publisherCode: string;
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  city?: string;
  audienceType?: string;
  promoDescription?: string;
  payoutMethod?: PayoutMethod;
  payoutDetails?: string;
  status?: PublisherStatus;
}

export type UpdatePublisherInput = Partial<Omit<Publisher, 'id' | 'createdAt'>>;

export class PublisherService {
  constructor(
    private readonly publishers: PublisherRepo,
    private readonly audit?: AuditService,
  ) {}

  async getById(id: string): Promise<Publisher | null> {
    return this.publishers.getById(id);
  }

  async getByCode(code: string): Promise<Publisher | null> {
    return this.publishers.getByCode(code);
  }

  async list(filter?: Partial<Publisher>): Promise<Publisher[]> {
    return this.publishers.list(filter);
  }

  async create(input: CreatePublisherInput): Promise<Publisher> {
    const publisherCode = normalizeCode(requireField(input.publisherCode, 'publisherCode'));
    const fullName = requireField(input.fullName, 'fullName');
    const email = normalizeEmail(requireField(input.email, 'email'));
    const phone = requireField(input.phone, 'phone');
    if (!isEmail(email)) throw new ValidationError('email is not a valid address', { email });

    if (await this.publishers.getByCode(publisherCode)) {
      throw new ConflictError(`Publisher code ${publisherCode} already exists`, { publisherCode });
    }
    if (await this.findByEmail(email)) {
      throw new ConflictError(`A publisher with email ${email} already exists`, { email });
    }

    return this.publishers.create({
      publisherCode,
      fullName,
      email,
      phone,
      country: input.country,
      city: input.city,
      audienceType: input.audienceType,
      promoDescription: input.promoDescription,
      payoutMethod: input.payoutMethod,
      payoutDetails: input.payoutDetails,
      status: input.status ?? 'pending',
    });
  }

  async update(id: string, patch: UpdatePublisherInput): Promise<Publisher> {
    const next: UpdatePublisherInput = { ...patch };

    if (next.publisherCode !== undefined) {
      next.publisherCode = normalizeCode(next.publisherCode);
      const clash = await this.publishers.getByCode(next.publisherCode);
      if (clash && clash.id !== id) {
        throw new ConflictError(`Publisher code ${next.publisherCode} already exists`, {
          publisherCode: next.publisherCode,
        });
      }
    }

    if (next.email !== undefined) {
      next.email = normalizeEmail(next.email);
      if (!isEmail(next.email)) throw new ValidationError('email is not a valid address', { email: next.email });
      const clash = await this.findByEmail(next.email);
      if (clash && clash.id !== id) {
        throw new ConflictError(`A publisher with email ${next.email} already exists`, {
          email: next.email,
        });
      }
    }

    return this.publishers.update(id, next);
  }

  /**
   * Public application (Become-a-Publisher): creates a `pending` publisher with an
   * auto-generated unique publisher code (admin can rename on approval).
   */
  async apply(input: Omit<CreatePublisherInput, 'publisherCode' | 'status'>): Promise<Publisher> {
    const publisherCode = await this.uniqueCode(baseCode(input.fullName));
    return this.create({ ...input, publisherCode, status: 'pending' });
  }

  /** Admin: approve → provision (status active, approvedAt, authUserId) + audit. */
  async approve(id: string, actor: string): Promise<Publisher> {
    const publisher = await this.publishers.getById(id);
    if (!publisher) throw new NotFoundError(`Publisher ${id} not found`);
    const updated = await this.publishers.update(id, {
      status: 'active',
      approvedAt: new Date().toISOString(),
      authUserId: publisher.authUserId ?? publisher.id,
    });
    await this.audit?.log(actor, 'publisher', id, 'approved', {});
    return updated;
  }

  /** Admin: suspend a publisher + audit. */
  async suspend(id: string, actor: string): Promise<Publisher> {
    const publisher = await this.publishers.getById(id);
    if (!publisher) throw new NotFoundError(`Publisher ${id} not found`);
    const updated = await this.publishers.update(id, { status: 'suspended' });
    await this.audit?.log(actor, 'publisher', id, 'suspended', {});
    return updated;
  }

  private async findByEmail(email: string): Promise<Publisher | null> {
    const all = await this.publishers.list();
    return all.find((p) => p.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  private async uniqueCode(base: string): Promise<string> {
    if (!(await this.publishers.getByCode(base))) return base;
    for (let i = 2; i < 1000; i += 1) {
      const candidate = `${base}${i}`;
      if (!(await this.publishers.getByCode(candidate))) return candidate;
    }
    return `${base}${Date.now()}`;
  }
}

/** Derive a publisher-code base from a name: uppercase letters/digits, max 10 chars. */
function baseCode(fullName: string): string {
  const cleaned = (fullName ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  return cleaned || 'PUBLISHER';
}

function requireField(value: string | undefined, name: string): string {
  const v = (value ?? '').trim();
  if (!v) throw new ValidationError(`${name} is required`, { field: name });
  return v;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
