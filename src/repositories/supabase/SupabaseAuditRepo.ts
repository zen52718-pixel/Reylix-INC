import type { AuditEntry } from '@/src/domain/types';
import type { AuditRepo } from '@/src/repositories/interfaces';
import { rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { auditFromRow, auditToRow } from '@/src/repositories/supabase/mappers';

const TABLE = 'audit';

export class SupabaseAuditRepo implements AuditRepo {
  async append(entry: Omit<AuditEntry, 'id'>): Promise<void> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(auditToRow(entry as Partial<AuditEntry>));
    rows(res as never, 'audit.append');
  }

  async list(filter?: Partial<AuditEntry>): Promise<AuditEntry[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(auditToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('occurred_at', { ascending: false });
    return rows(res as never, 'audit.list').map(auditFromRow);
  }
}
