import type { Client } from '@/src/domain/types';
import type { ClientRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { clientFromRow, clientToRow, compact, type Row } from '@/src/repositories/supabase/mappers';

const TABLE = 'clients';

export class SupabaseClientRepo implements ClientRepo {
  async getById(id: string): Promise<Client | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'clients.getById');
    return row ? clientFromRow(row) : null;
  }

  async list(filter?: Partial<Client>): Promise<Client[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(clientToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'clients.list').map(clientFromRow);
  }

  async create(c: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(clientToRow(c as Partial<Client>))
      .select('*')
      .single();
    return clientFromRow(requireRow(res as never, 'clients.create', 'inserted row'));
  }

  async update(id: string, patch: Partial<Client>): Promise<Client> {
    const changes = compact(clientToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return clientFromRow(requireRow(res as never, 'clients.update', id));
  }
}
