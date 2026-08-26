import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '@/src/domain/errors';
import type { LeadAttribution } from '@/src/domain/types';
import type { LeadAttributionRepo } from '@/src/repositories/interfaces';

/**
 * In-memory attribution store.
 *
 * The "exactly one live attribution per lead" rule is enforced here as well as by a
 * unique partial index in Postgres. Both adapters must reject the same thing, or the
 * contract test is lying about their equivalence.
 */
export class MemoryLeadAttributionRepo implements LeadAttributionRepo {
  private readonly rows: LeadAttribution[] = [];

  async append(a: Omit<LeadAttribution, 'id'>): Promise<LeadAttribution> {
    if (!a.supersededAt) {
      const live = this.rows.find((r) => r.leadId === a.leadId && !r.supersededAt);
      if (live) {
        throw new ConflictError(`Lead ${a.leadId} already has a live attribution`, {
          leadId: a.leadId,
          existingAttributionId: live.id,
        });
      }
    }
    const row: LeadAttribution = { ...a, id: randomUUID() };
    this.rows.push(row);
    return row;
  }

  async getCurrentForLead(leadId: string): Promise<LeadAttribution | null> {
    return this.rows.find((r) => r.leadId === leadId && !r.supersededAt) ?? null;
  }

  async listByLead(leadId: string): Promise<LeadAttribution[]> {
    return this.rows.filter((r) => r.leadId === leadId);
  }

  async listByPublisher(publisherId: string): Promise<LeadAttribution[]> {
    return this.rows.filter((r) => r.publisherId === publisherId);
  }

  async supersede(id: string, at: string, reason?: string): Promise<LeadAttribution> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new NotFoundError(`Attribution ${id} not found`);
    const existing = this.rows[idx] as LeadAttribution;
    const updated: LeadAttribution = { ...existing, supersededAt: at, reason: reason ?? existing.reason };
    this.rows[idx] = updated;
    return updated;
  }
}
