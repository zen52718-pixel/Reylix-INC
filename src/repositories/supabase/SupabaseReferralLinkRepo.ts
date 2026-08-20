import type { ReferralLink } from '@/src/domain/types';
import type { ReferralLinkRepo } from '@/src/repositories/interfaces';
import { maybeRow, requireRow, rows } from '@/src/repositories/supabase/_util';
import { getServiceClient } from '@/src/repositories/supabase/client';
import { referralLinkFromRow, referralLinkToRow } from '@/src/repositories/supabase/mappers';

const TABLE = 'referral_links';

export class SupabaseReferralLinkRepo implements ReferralLinkRepo {
  async getByCode(refCode: string): Promise<ReferralLink | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('ref_code', refCode.trim().toUpperCase())
      .single();
    const row = maybeRow(res as never, 'referralLinks.getByCode');
    return row ? referralLinkFromRow(row) : null;
  }

  async getByPublisherAndOffer(publisherId: string, offerId: string): Promise<ReferralLink | null> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('publisher_id', publisherId)
      .eq('offer_id', offerId)
      .single();
    const row = maybeRow(res as never, 'referralLinks.getByPublisherAndOffer');
    return row ? referralLinkFromRow(row) : null;
  }

  async listByPublisher(publisherId: string): Promise<ReferralLink[]> {
    const res = await getServiceClient()
      .from(TABLE)
      .select('*')
      .eq('publisher_id', publisherId)
      .order('created_at', { ascending: false });
    return rows(res as never, 'referralLinks.listByPublisher').map(referralLinkFromRow);
  }

  async create(r: Omit<ReferralLink, 'id' | 'createdAt'>): Promise<ReferralLink> {
    const res = await getServiceClient()
      .from(TABLE)
      .insert(referralLinkToRow(r as Partial<ReferralLink>))
      .select('*')
      .single();
    return referralLinkFromRow(requireRow(res as never, 'referralLinks.create', 'inserted row'));
  }
}
