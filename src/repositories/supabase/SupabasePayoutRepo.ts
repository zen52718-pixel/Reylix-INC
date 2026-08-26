import type { PayoutRow, PayoutStatus } from '@/src/domain/types';
import type { PayoutRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { compact, payoutFromRow, payoutToRow, type Row } from '@/src/repositories/supabase/mappers';

const TABLE = 'payouts';

export class SupabasePayoutRepo implements PayoutRepo {
  /**
   * One payout row per (publisher, period). The unique index on those two columns lets
   * the database do the upsert atomically, so regenerating a period never double-inserts
   * even if two admins click Generate at the same moment.
   */
  async upsertPeriod(row: Omit<PayoutRow, 'id'>): Promise<PayoutRow> {
    const res = await getServiceClient()
      .from(TABLE)
      .upsert(payoutToRow(row as Partial<PayoutRow>), {
        onConflict: 'publisher_id,period_label',
      })
      .select('*')
      .single();
    return payoutFromRow(requireRow(res as never, 'payouts.upsertPeriod', row.periodLabel));
  }

  async getById(id: string): Promise<PayoutRow | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'payouts.getById');
    return row ? payoutFromRow(row) : null;
  }

  async list(filter?: Partial<PayoutRow>): Promise<PayoutRow[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(payoutToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'payouts.list').map(payoutFromRow);
  }

  async transition(
    id: string,
    status: PayoutStatus,
    patch?: Partial<PayoutRow>,
  ): Promise<PayoutRow> {
    const changes = compact(payoutToRow({ ...patch, status }) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return payoutFromRow(requireRow(res as never, 'payouts.transition', id));
  }
}
