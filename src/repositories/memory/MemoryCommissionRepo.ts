import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '@/src/domain/errors';
import type { Commission } from '@/src/domain/types';
import { LIVE_COMMISSION_STATUSES } from '@/src/domain/types';
import type { CommissionFilter, CommissionRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

const isLive = (c: Commission): boolean =>
  (LIVE_COMMISSION_STATUSES as readonly string[]).includes(c.status);

/**
 * In-memory commission store.
 *
 * Enforces at most one live commission per lead, mirroring the unique partial index in
 * Postgres. Paying twice for the same lead is the failure this guard exists to prevent.
 */
export class MemoryCommissionRepo implements CommissionRepo {
  private readonly store = new Map<string, Commission>();

  async create(c: Omit<Commission, 'id'>): Promise<Commission> {
    const existing = [...this.store.values()].find((r) => r.leadId === c.leadId && isLive(r));
    if (existing) {
      throw new ConflictError(`Lead ${c.leadId} already has a live commission`, {
        leadId: c.leadId,
        existingCommissionId: existing.id,
      });
    }
    const commission: Commission = { ...c, id: randomUUID() };
    this.store.set(commission.id, commission);
    return commission;
  }

  async getById(id: string): Promise<Commission | null> {
    return this.store.get(id) ?? null;
  }

  async list(filter?: CommissionFilter): Promise<Commission[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter as Partial<Commission>)) : rows;
  }

  async getLiveForLead(leadId: string): Promise<Commission | null> {
    return [...this.store.values()].find((r) => r.leadId === leadId && isLive(r)) ?? null;
  }

  async update(id: string, patch: Partial<Commission>): Promise<Commission> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Commission ${id} not found`);
    // The amount is immutable: a correction is a void plus a new record, never an edit.
    const { amount: _ignored, ...safe } = patch;
    const updated: Commission = { ...existing, ...safe, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
