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
   * Every filter is applied as a real column predicate, so scoping to one publisher or
   * one client is database-side rather than an in-process filter over every row.
   */
  async list(filter?: LeadFilter): Promise<Lead[]> {
    let q = getServiceClient().from(TABLE).select('*');
    if (filter?.publisherId !== undefined) q = q.eq('publisher_id', filter.publisherId);
    if (filter?.offerId !== undefined) q = q.eq('offer_id', filter.offerId);
    if (filter?.clientId !== undefined) q = q.eq('client_id', filter.clientId);
    if (filter?.productId !== undefined) q = q.eq('product_id', filter.productId);
    if (filter?.campaignId !== undefined) q = q.eq('campaign_id', filter.campaignId);
    if (filter?.status !== undefined) q = q.eq('status', filter.status);
    if (filter?.from) q = q.gte('created_at', filter.from);
    if (filter?.to) q = q.lte('created_at', filter.to);
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'leads.list').map(leadFromRow);
  }

  async findRecentByDedupKey(dedupKey: string, withinMs: number): Promise<Lead | null> {
    const since = new Date(Date.now() - withinMs).toISOString();
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('dedup_key', dedupKey)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);
    const found = rows(res as never, 'leads.findRecentByDedupKey');
    return found.length > 0 ? leadFromRow(found[0] as Row) : null;
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
