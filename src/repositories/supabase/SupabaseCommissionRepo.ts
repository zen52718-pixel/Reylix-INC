import type { Commission } from '@/src/domain/types';
import { LIVE_COMMISSION_STATUSES } from '@/src/domain/types';
import type { CommissionFilter, CommissionRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import {
  commissionFromRow,
  commissionToRow,
  compact,
  type Row,
} from '@/src/repositories/supabase/mappers';

const TABLE = 'commissions';

/**
 * Commission store.
 *
 * At most one live commission per lead is enforced by a unique partial index, so paying
 * twice for the same lead fails at the database even under a race.
 */
export class SupabaseCommissionRepo implements CommissionRepo {
  async create(c: Omit<Commission, 'id'>): Promise<Commission> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(commissionToRow(c as Partial<Commission>))
      .select('*')
      .single();
    return commissionFromRow(requireRow(res as never, 'commissions.create', 'inserted row'));
  }

  async getById(id: string): Promise<Commission | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'commissions.getById');
    return row ? commissionFromRow(row) : null;
  }

  async list(filter?: CommissionFilter): Promise<Commission[]> {
    let q = getServiceClient().from(TABLE).select('*');
    if (filter?.publisherId !== undefined) q = q.eq('publisher_id', filter.publisherId);
    if (filter?.clientId !== undefined) q = q.eq('client_id', filter.clientId);
    if (filter?.offerId !== undefined) q = q.eq('offer_id', filter.offerId);
    if (filter?.leadId !== undefined) q = q.eq('lead_id', filter.leadId);
    if (filter?.payoutId !== undefined) q = q.eq('payout_id', filter.payoutId);
    if (filter?.status !== undefined) q = q.eq('status', filter.status);
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'commissions.list').map(commissionFromRow);
  }

  async getLiveForLead(leadId: string): Promise<Commission | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('lead_id', leadId)
      .in('status', [...LIVE_COMMISSION_STATUSES])
      .limit(1);
    const found = rows(res as never, 'commissions.getLiveForLead');
    return found.length > 0 ? commissionFromRow(found[0] as Row) : null;
  }

  async update(id: string, patch: Partial<Commission>): Promise<Commission> {
    const changes = compact(commissionToRow(patch) as Row);
    delete changes.id;
    // The amount is immutable: a correction is a void plus a new record, never an edit.
    delete changes.amount;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return commissionFromRow(requireRow(res as never, 'commissions.update', id));
  }
}
