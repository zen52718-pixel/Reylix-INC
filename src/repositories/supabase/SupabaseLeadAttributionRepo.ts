import type { LeadAttribution } from '@/src/domain/types';
import type { LeadAttributionRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import {
  leadAttributionFromRow,
  leadAttributionToRow,
} from '@/src/repositories/supabase/mappers';

const TABLE = 'lead_attributions';

/**
 * Append-only attribution store.
 *
 * The "exactly one live attribution per lead" rule is enforced by a unique partial index
 * on `lead_id WHERE superseded_at IS NULL`. A concurrent double-attribution therefore
 * fails at the database rather than producing two publishers with a claim on one lead.
 */
export class SupabaseLeadAttributionRepo implements LeadAttributionRepo {
  async append(a: Omit<LeadAttribution, 'id'>): Promise<LeadAttribution> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(leadAttributionToRow(a as Partial<LeadAttribution>))
      .select('*')
      .single();
    return leadAttributionFromRow(
      requireRow(res as never, 'leadAttributions.append', 'inserted row'),
    );
  }

  async getCurrentForLead(leadId: string): Promise<LeadAttribution | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('lead_id', leadId)
      .is('superseded_at', null)
      .single();
    const row = maybeRow(res as never, 'leadAttributions.getCurrentForLead');
    return row ? leadAttributionFromRow(row) : null;
  }

  async listByLead(leadId: string): Promise<LeadAttribution[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('lead_id', leadId)
      .order('attributed_at', { ascending: false });
    return rows(res as never, 'leadAttributions.listByLead').map(leadAttributionFromRow);
  }

  async listByPublisher(publisherId: string): Promise<LeadAttribution[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('publisher_id', publisherId)
      .order('attributed_at', { ascending: false });
    return rows(res as never, 'leadAttributions.listByPublisher').map(leadAttributionFromRow);
  }

  async supersede(id: string, at: string, reason?: string): Promise<LeadAttribution> {
    const patch: Record<string, unknown> = { superseded_at: at };
    if (reason !== undefined) patch.reason = reason;
    const res = await getServiceClient()
      .from(TABLE)
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    return leadAttributionFromRow(requireRow(res as never, 'leadAttributions.supersede', id));
  }
}
