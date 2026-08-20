import type { Buyer } from '@/src/domain/types';
import type { BuyerRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { buyerFromRow, buyerToRow, compact, type Row } from '@/src/repositories/supabase/mappers';

const TABLE = 'buyers';

export class SupabaseBuyerRepo implements BuyerRepo {
  async getById(id: string): Promise<Buyer | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'buyers.getById');
    return row ? buyerFromRow(row) : null;
  }

  async list(filter?: Partial<Buyer>): Promise<Buyer[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(buyerToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'buyers.list').map(buyerFromRow);
  }

  async create(b: Omit<Buyer, 'id' | 'createdAt'>): Promise<Buyer> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(buyerToRow(b as Partial<Buyer>))
      .select('*')
      .single();
    return buyerFromRow(requireRow(res as never, 'buyers.create', 'inserted row'));
  }

  async update(id: string, patch: Partial<Buyer>): Promise<Buyer> {
    const changes = compact(buyerToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return buyerFromRow(requireRow(res as never, 'buyers.update', id));
  }
}
