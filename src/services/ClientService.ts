/**
 * ClientService — all client business logic. Storage-agnostic: depends only on the
 * ClientRepo interface.
 *
 * A Client is the BUSINESS purchasing acquisition services and receiving consumer leads.
 * It is never the consumer, and never an inbound enquiry from the marketing site.
 *
 * Clients are ADMIN-MANAGED in this phase: there is no client login and no self-serve
 * portal, so every method here is reached through an admin-authenticated route.
 */
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { Client, ClientStatus } from '@/src/domain/types';
import type { ClientRepo } from '@/src/repositories/interfaces';
import type { AuditService } from '@/src/services/AuditService';

export interface CreateClientInput {
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status?: ClientStatus;
  notes?: string;
}

export type UpdateClientInput = Partial<Omit<Client, 'id' | 'createdAt'>>;

export class ClientService {
  constructor(
    private readonly clients: ClientRepo,
    private readonly audit?: AuditService,
  ) {}

  async getById(id: string): Promise<Client | null> {
    return this.clients.getById(id);
  }

  async list(filter?: Partial<Client>): Promise<Client[]> {
    return this.clients.list(filter);
  }

  /** Only clients that can currently receive leads. */
  async listActive(): Promise<Client[]> {
    return this.clients.list({ status: 'active' });
  }

  async create(input: CreateClientInput, actor?: string): Promise<Client> {
    const company = requireField(input.company, 'company');
    const contactName = requireField(input.contactName, 'contactName');
    const contactEmail = normalizeEmail(requireField(input.contactEmail, 'contactEmail'));
    if (!isEmail(contactEmail)) {
      throw new ValidationError('contactEmail is not a valid address', { contactEmail });
    }
    if (await this.findByCompany(company)) {
      throw new ConflictError('A client named ' + company + ' already exists', { company });
    }

    const client = await this.clients.create({
      company,
      contactName,
      contactEmail,
      contactPhone: input.contactPhone?.trim() || undefined,
      status: input.status ?? 'active',
      notes: input.notes?.trim() || undefined,
    });
    if (actor) await this.audit?.log(actor, 'client', client.id, 'created', { company });
    return client;
  }

  async update(id: string, patch: UpdateClientInput, actor?: string): Promise<Client> {
    const existing = await this.clients.getById(id);
    if (!existing) throw new NotFoundError('Client ' + id + ' not found');

    const next: UpdateClientInput = { ...patch };
    if (next.company !== undefined) {
      next.company = requireField(next.company, 'company');
      const clash = await this.findByCompany(next.company);
      if (clash && clash.id !== id) {
        throw new ConflictError('A client named ' + next.company + ' already exists', {
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

    const updated = await this.clients.update(id, next);
    if (actor) await this.audit?.log(actor, 'client', id, 'updated', { patch: next });
    return updated;
  }

  /** Pause a client: their offers stop accepting new leads. Delivered leads are untouched. */
  async setStatus(id: string, status: ClientStatus, actor: string): Promise<Client> {
    const existing = await this.clients.getById(id);
    if (!existing) throw new NotFoundError('Client ' + id + ' not found');
    const updated = await this.clients.update(id, { status });
    await this.audit?.log(actor, 'client', id, 'status_changed', {
      from: existing.status,
      to: status,
    });
    return updated;
  }

  private async findByCompany(company: string): Promise<Client | null> {
    const all = await this.clients.list();
    const target = company.trim().toLowerCase();
    return all.find((c) => c.company.trim().toLowerCase() === target) ?? null;
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
