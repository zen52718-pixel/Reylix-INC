/**
 * Supabase (Postgres) adapter. Satisfies exactly the same repository interfaces as the
 * Memory adapter and passes the shared adapter contract test, so switching backends is
 * a change to STORAGE_BACKEND and nothing else — no service, controller, or UI edits.
 *
 * These repositories run server-side on the service-role client. RLS still guards the
 * database against anything that reaches it directly (the browser, a leaked anon key);
 * see `supabase/schema.sql` for the policies and `client.ts` for the user-scoped client
 * used where a query should run as the signed-in publisher.
 */
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { SupabaseAuditRepo } from '@/src/repositories/supabase/SupabaseAuditRepo';
import { SupabaseBuyerRepo } from '@/src/repositories/supabase/SupabaseBuyerRepo';
import { SupabaseClickRepo } from '@/src/repositories/supabase/SupabaseClickRepo';
import { SupabaseContactRepo } from '@/src/repositories/supabase/SupabaseContactRepo';
import { SupabaseLeadRepo } from '@/src/repositories/supabase/SupabaseLeadRepo';
import { SupabaseOfferRepo } from '@/src/repositories/supabase/SupabaseOfferRepo';
import { SupabasePayoutRepo } from '@/src/repositories/supabase/SupabasePayoutRepo';
import { SupabasePublisherRepo } from '@/src/repositories/supabase/SupabasePublisherRepo';
import { SupabaseReferralLinkRepo } from '@/src/repositories/supabase/SupabaseReferralLinkRepo';

export function createSupabaseRepositories(): RepositoryBundle {
  return {
    buyers: new SupabaseBuyerRepo(),
    publishers: new SupabasePublisherRepo(),
    offers: new SupabaseOfferRepo(),
    referralLinks: new SupabaseReferralLinkRepo(),
    clicks: new SupabaseClickRepo(),
    leads: new SupabaseLeadRepo(),
    payouts: new SupabasePayoutRepo(),
    audit: new SupabaseAuditRepo(),
    contacts: new SupabaseContactRepo(),
  };
}
