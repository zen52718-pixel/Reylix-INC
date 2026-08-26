/**
 * Supabase (Postgres) adapter. Satisfies exactly the same repository interfaces as the
 * Memory adapter and passes the shared adapter contract test, so switching backends is
 * a change to STORAGE_BACKEND and nothing else — no service, controller, or UI edits.
 *
 * These repositories run server-side on the service-role client. RLS still guards the
 * database against anything that reaches it directly (the browser, a leaked anon key);
 * see `supabase/migrations/` for the policies and `client.ts` for the user-scoped client
 * used where a query should run as the signed-in publisher.
 */
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { SupabaseAuditRepo } from '@/src/repositories/supabase/SupabaseAuditRepo';
import { SupabaseCampaignRepo } from '@/src/repositories/supabase/SupabaseCampaignRepo';
import { SupabaseClickRepo } from '@/src/repositories/supabase/SupabaseClickRepo';
import { SupabaseClientRepo } from '@/src/repositories/supabase/SupabaseClientRepo';
import { SupabaseCommissionRepo } from '@/src/repositories/supabase/SupabaseCommissionRepo';
import { SupabaseInquiryRepo } from '@/src/repositories/supabase/SupabaseInquiryRepo';
import { SupabaseLeadAttributionRepo } from '@/src/repositories/supabase/SupabaseLeadAttributionRepo';
import { SupabaseLeadRepo } from '@/src/repositories/supabase/SupabaseLeadRepo';
import { SupabaseOfferRepo } from '@/src/repositories/supabase/SupabaseOfferRepo';
import { SupabasePayoutRepo } from '@/src/repositories/supabase/SupabasePayoutRepo';
import { SupabaseProductRepo } from '@/src/repositories/supabase/SupabaseProductRepo';
import { SupabasePublisherRepo } from '@/src/repositories/supabase/SupabasePublisherRepo';
import { SupabaseReferralLinkRepo } from '@/src/repositories/supabase/SupabaseReferralLinkRepo';

export function createSupabaseRepositories(): RepositoryBundle {
  return {
    clients: new SupabaseClientRepo(),
    products: new SupabaseProductRepo(),
    campaigns: new SupabaseCampaignRepo(),
    publishers: new SupabasePublisherRepo(),
    offers: new SupabaseOfferRepo(),
    referralLinks: new SupabaseReferralLinkRepo(),
    clicks: new SupabaseClickRepo(),
    leads: new SupabaseLeadRepo(),
    leadAttributions: new SupabaseLeadAttributionRepo(),
    commissions: new SupabaseCommissionRepo(),
    payouts: new SupabasePayoutRepo(),
    audit: new SupabaseAuditRepo(),
    inquiries: new SupabaseInquiryRepo(),
  };
}
