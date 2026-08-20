import type { Lead, LeadStatus } from '@/src/domain/types';
import type { LeadFilter, LeadRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { compact, leadFromRow, leadToRow, type Row } from '@/src/repositories/supabase/mappers';

const TABLE = 'leads';

export class SupabaseLeadRepo implements LeadRepo {
  async append(l: Omit<Lead, 'id'>): Promise<Lead> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(leadToRow(l as Partial<Lead>))
      .select('*')
      .single();
    return leadFromRow(requireRow(res as never, 'leads.append', 'inserted row'));
  }

  async getById(id: string): Promise<Lead | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'leads.getById');
    return row ? leadFromRow(row) : null;
  }

  /**
   * `publisherId` is applied as a real column predicate, so a caller that scopes to one
   * publisher gets database-side filtering rather than an in-process filter over every row.
   */
  async list(filter?: LeadFilter): Promise<Lead[]> {
    let q = getServiceClient().from(TABLE).select('*');
    if (filter?.publisherId !== undefined) q = q.eq('publisher_id', filter.publisherId);
    if (filter?.offerId !== undefined) q = q.eq('offer_id', filter.offerId);
    if (filter?.buyerId !== undefined) q = q.eq('buyer_id', filter.buyerId);
    if (filter?.status !== undefined) q = q.eq('status', filter.status);
    if (filter?.from) q = q.gte('created_at', filter.from);
    if (filter?.to) q = q.lte('created_at', filter.to);
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'leads.list').map(leadFromRow);
  }

  async updateStatus(id: string, status: LeadStatus, patch?: Partial<Lead>): Promise<Lead> {
    return this.applyPatch(id, { ...patch, status });
  }

  async update(id: string, patch: Partial<Lead>): Promise<Lead> {
    return this.applyPatch(id, patch);
  }

  private async applyPatch(id: string, patch: Partial<Lead>): Promise<Lead> {
    const changes = compact(leadToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return leadFromRow(requireRow(res as never, 'leads.update', id));
  }
}
