import type { Click } from '@/src/domain/types';
import type { ClickRepo, DateRange } from '@/src/repositories/interfaces';
import { rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { clickFromRow, clickToRow } from '@/src/repositories/supabase/mappers';

const TABLE = 'clicks';

export class SupabaseClickRepo implements ClickRepo {
  async append(c: Omit<Click, 'id'>): Promise<void> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(clickToRow(c as Partial<Click>));
    rows(res as never, 'clicks.append');
  }

  async listByPublisher(publisherId: string, range?: DateRange): Promise<Click[]> {
    let q = getServiceClient().from(TABLE).select('*').eq('publisher_id', publisherId);
    if (range?.from) q = q.gte('clicked_at', range.from);
    if (range?.to) q = q.lte('clicked_at', range.to);
    const res = await q.order('clicked_at', { ascending: false });
    return rows(res as never, 'clicks.listByPublisher').map(clickFromRow);
  }

  /**
   * True if this dedup key was seen inside the window. Only the existence of a row
   * matters, so the projection is limited to `id` and capped at one row.
   */
  async recentDedup(dedupKey: string, withinMs: number): Promise<boolean> {
    const since = new Date(Date.now() - withinMs).toISOString();
    const res = await getServiceClient()
      .from(TABLE)
      .select('id')
      .eq('dedup_key', dedupKey)
      .gte('clicked_at', since)
      .limit(1);
    return rows(res as never, 'clicks.recentDedup').length > 0;
  }
}
