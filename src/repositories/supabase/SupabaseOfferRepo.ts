import type { Offer } from '@/src/domain/types';
import type { OfferRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { compact, offerFromRow, offerToRow, type Row } from '@/src/repositories/supabase/mappers';

const TABLE = 'offers';

export class SupabaseOfferRepo implements OfferRepo {
  async getById(id: string): Promise<Offer | null> {
    const res = await getServiceClient().from(TABLE).select('*').eq('id', id).single();
    const row = maybeRow(res as never, 'offers.getById');
    return row ? offerFromRow(row) : null;
  }

  async getByCode(code: string): Promise<Offer | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('offer_code', code.trim().toUpperCase())
      .single();
    const row = maybeRow(res as never, 'offers.getByCode');
    return row ? offerFromRow(row) : null;
  }

  async list(): Promise<Offer[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    return rows(res as never, 'offers.list').map(offerFromRow);
  }

  async listActive(): Promise<Offer[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return rows(res as never, 'offers.listActive').map(offerFromRow);
  }

  async listByBuyer(buyerId: string): Promise<Offer[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });
    return rows(res as never, 'offers.listByBuyer').map(offerFromRow);
  }

  async create(o: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(offerToRow(o as Partial<Offer>))
      .select('*')
      .single();
    return offerFromRow(requireRow(res as never, 'offers.create', 'inserted row'));
  }

  async update(id: string, patch: Partial<Offer>): Promise<Offer> {
    const changes = compact(offerToRow(patch) as Row);
    delete changes.id;
    const res = await getServiceClient()
      .from(TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();
    return offerFromRow(requireRow(res as never, 'offers.update', id));
  }
}
