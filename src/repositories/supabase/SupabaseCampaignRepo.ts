import type { Campaign } from '@/src/domain/types';
import type { CampaignRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import {
  campaignFromRow,
  campaignToRow,
  compact,
  type Row,
} from '@/src/repositories/supabase/mappers';

const TABLE = 'campaigns';

export class SupabaseCampaignRepo implements CampaignRepo {
  async getById(id: string): Promise<Campaign | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'campaigns.getById');
    return row ? campaignFromRow(row) : null;
  }

  async listByProduct(productId: string): Promise<Campaign[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    return rows(res as never, 'campaigns.listByProduct').map(campaignFromRow);
  }

  async list(filter?: Partial<Campaign>): Promise<Campaign[]> {
    let q = getServiceClient().from(TABLE).select('*');
    for (const [col, value] of Object.entries(campaignToRow(filter ?? {}))) {
      q = q.eq(col, value as never);
    }
    const res = await q.order('created_at', { ascending: false });
    return rows(res as never, 'campaigns.list').map(campaignFromRow);
  }

  async create(c: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(campaignToRow(c as Partial<Campaign>))
      .select('*')
      .single();
    return campaignFromRow(requireRow(res as never, 'campaigns.create', 'inserted row'));
  }

  async update(id: string, patch: Partial<Campaign>): Promise<Campaign> {
    const changes = compact(campaignToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return campaignFromRow(requireRow(res as never, 'campaigns.update', id));
  }
}
