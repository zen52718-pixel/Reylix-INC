import type { Inquiry } from '@/src/domain/types';
import type { InquiryRepo } from '@/src/repositories/interfaces';
import { requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { inquiryFromRow, inquiryToRow } from '@/src/repositories/supabase/mappers';

const TABLE = 'inquiries';

export class SupabaseInquiryRepo implements InquiryRepo {
  async append(i: Omit<Inquiry, 'id'>): Promise<Inquiry> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(inquiryToRow(i as Partial<Inquiry>))
      .select('*')
      .single();
    return inquiryFromRow(requireRow(res as never, 'inquiries.append', 'inserted row'));
  }

  async list(filter?: Partial<Inquiry>): Promise<Inquiry[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(inquiryToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'inquiries.list').map(inquiryFromRow);
  }
}
