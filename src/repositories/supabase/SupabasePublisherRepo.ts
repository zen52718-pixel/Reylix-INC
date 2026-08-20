import type { Publisher } from '@/src/domain/types';
import type { PublisherRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import {
  compact,
  publisherFromRow,
  publisherToRow,
  type Row,
} from '@/src/repositories/supabase/mappers';

const TABLE = 'publishers';

export class SupabasePublisherRepo implements PublisherRepo {
  async getById(id: string): Promise<Publisher | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'publishers.getById');
    return row ? publisherFromRow(row) : null;
  }

  /** Publisher codes are stored uppercase; the unique index is on the uppercase value. */
  async getByCode(code: string): Promise<Publisher | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('publisher_code', code.trim().toUpperCase())
      .single();
    const row = maybeRow(res as never, 'publishers.getByCode');
    return row ? publisherFromRow(row) : null;
  }

  async getByAuthUserId(authUserId: string): Promise<Publisher | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    const row = maybeRow(res as never, 'publishers.getByAuthUserId');
    return row ? publisherFromRow(row) : null;
  }

  async list(filter?: Partial<Publisher>): Promise<Publisher[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(publisherToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'publishers.list').map(publisherFromRow);
  }

  async create(p: Omit<Publisher, 'id' | 'createdAt'>): Promise<Publisher> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(publisherToRow(p as Partial<Publisher>))
      .select('*')
      .single();
    return publisherFromRow(requireRow(res as never, 'publishers.create', 'inserted row'));
  }

  async update(id: string, patch: Partial<Publisher>): Promise<Publisher> {
    const changes = compact(publisherToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return publisherFromRow(requireRow(res as never, 'publishers.update', id));
  }
}
