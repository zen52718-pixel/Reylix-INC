import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { Lead, LeadStatus } from '@/src/domain/types';
import type { LeadFilter, LeadRepo } from '@/src/repositories/interfaces';
import { withinRange } from '@/src/repositories/memory/_util';

export class MemoryLeadRepo implements LeadRepo {
  private readonly store = new Map<string, Lead>();

  async append(l: Omit<Lead, 'id'>): Promise<Lead> {
    const lead: Lead = { ...l, id: randomUUID() };
    this.store.set(lead.id, lead);
    return lead;
  }

  async getById(id: string): Promise<Lead | null> {
    return this.store.get(id) ?? null;
  }

  async list(filter?: LeadFilter): Promise<Lead[]> {
    let rows = [...this.store.values()];
    if (filter) {
      const { publisherId, offerId, buyerId, status, from, to } = filter;
      rows = rows.filter((r) => {
        if (publisherId !== undefined && r.publisherId !== publisherId) return false;
        if (offerId !== undefined && r.offerId !== offerId) return false;
        if (buyerId !== undefined && r.buyerId !== buyerId) return false;
        if (status !== undefined && r.status !== status) return false;
        if (!withinRange(r.createdAt, { from, to })) return false;
        return true;
      });
    }
    return rows;
  }

  async updateStatus(id: string, status: LeadStatus, patch?: Partial<Lead>): Promise<Lead> {
    return this.applyPatch(id, { ...patch, status });
  }

  async update(id: string, patch: Partial<Lead>): Promise<Lead> {
    return this.applyPatch(id, patch);
  }

  private applyPatch(id: string, patch: Partial<Lead>): Lead {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Lead ${id} not found`);
    const updated: Lead = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
