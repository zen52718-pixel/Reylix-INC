import { randomUUID } from 'node:crypto';
import { NotFoundError } from '@/src/domain/errors';
import type { PayoutRow, PayoutStatus } from '@/src/domain/types';
import type { PayoutRepo } from '@/src/repositories/interfaces';
import { matchesFilter } from '@/src/repositories/memory/_util';

export class MemoryPayoutRepo implements PayoutRepo {
  private readonly store = new Map<string, PayoutRow>();

  async upsertPeriod(row: Omit<PayoutRow, 'id'>): Promise<PayoutRow> {
    for (const existing of this.store.values()) {
      if (existing.publisherId === row.publisherId && existing.periodLabel === row.periodLabel) {
        const updated: PayoutRow = { ...existing, ...row, id: existing.id };
        this.store.set(existing.id, updated);
        return updated;
      }
    }
    const created: PayoutRow = { ...row, id: randomUUID() };
    this.store.set(created.id, created);
    return created;
  }

  async getById(id: string): Promise<PayoutRow | null> {
    return this.store.get(id) ?? null;
  }

  async list(filter?: Partial<PayoutRow>): Promise<PayoutRow[]> {
    const rows = [...this.store.values()];
    return filter ? rows.filter((r) => matchesFilter(r, filter)) : rows;
  }

  async transition(
    id: string,
    status: PayoutStatus,
    patch?: Partial<PayoutRow>,
  ): Promise<PayoutRow> {
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError(`Payout ${id} not found`);
    const updated: PayoutRow = { ...existing, ...patch, status, id: existing.id };
    this.store.set(id, updated);
    return updated;
  }
}
