import type { Contact } from '@/src/domain/types';
import type { ContactRepo } from '@/src/repositories/interfaces';
import { requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { contactFromRow, contactToRow } from '@/src/repositories/supabase/mappers';

const TABLE = 'contacts';

export class SupabaseContactRepo implements ContactRepo {
  async append(c: Omit<Contact, 'id'>): Promise<Contact> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(contactToRow(c as Partial<Contact>))
      .select('*')
      .single();
    return contactFromRow(requireRow(res as never, 'contacts.append', 'inserted row'));
  }

  async list(filter?: Partial<Contact>): Promise<Contact[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(contactToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'contacts.list').map(contactFromRow);
  }
}
