/**
 * Publisher portal authorization.
 *
 * The rule the whole portal rests on: publisher identity comes from the verified
 * Supabase Auth session, is mapped to a Publisher row through `auth_user_id`, and is only
 * granted when that publisher is ACTIVE. A publisher id supplied by the browser is never
 * consulted anywhere.
 *
 * The module is split deliberately:
 *   `resolvePortalAccess()` is pure logic over a repository — fully unit-testable.
 *   `getPortalAccess()` is the thin shell that reads the session, and is the only part
 *   that needs a live Supabase project.
 *
 * Keeping the decision out of the shell is what allows every access rule below to be
 * proven by a test today, before any project exists.
 */
import { UnauthorizedError } from '@/src/domain/errors';
import type { Publisher } from '@/src/domain/types';
import { PORTAL_ACCESS_STATUS } from '@/src/domain/types';
import { getRepositories } from '@/src/repositories';
import type { PublisherRepo } from '@/src/repositories/interfaces';
import { getAuthUserId } from '@/src/lib/supabase/server';

export type PortalDenialReason =
  /** No verified Supabase session on the request. */
  | 'no_session'
  /** Signed in, but no publisher row is linked to that auth user. */
  | 'no_publisher'
  /** Linked, but the application has not been approved yet. */
  | 'pending'
  /** Linked, but the application was declined. */
  | 'rejected'
  /** Linked and previously active, but switched off. */
  | 'suspended';

export type PortalAccess =
  | { ok: true; publisher: Publisher }
  | { ok: false; reason: PortalDenialReason };

/**
 * Messages safe to show a person.
 *
 * `no_session` and `no_publisher` deliberately share wording: telling someone "you signed
 * in but you are not a publisher" confirms that a valid account exists, which is more
 * than an unauthenticated visitor should learn. The status reasons are specific because
 * they are actionable and reveal nothing a signed-in publisher does not already know.
 */
export const PORTAL_DENIAL_MESSAGE: Record<PortalDenialReason, string> = {
  no_session: 'Sign in to continue.',
  no_publisher: 'Sign in to continue.',
  pending: 'Your application is still under review. We will email you when it is approved.',
  rejected: 'This application was not approved. Contact us if you think that is a mistake.',
  suspended: 'This account is suspended. Contact us to resolve it.',
};

/**
 * Decide portal access for an authenticated user id.
 *
 * Pure over the repository, so every branch is testable without Supabase.
 */
export async function resolvePortalAccess(
  publishers: PublisherRepo,
  authUserId: string | null,
): Promise<PortalAccess> {
  if (!authUserId) return { ok: false, reason: 'no_session' };

  const publisher = await publishers.getByAuthUserId(authUserId);
  if (!publisher) return { ok: false, reason: 'no_publisher' };

  if (publisher.status !== PORTAL_ACCESS_STATUS) {
    // Every non-active status maps to its own reason, so the portal never has to guess
    // why someone was refused.
    return { ok: false, reason: publisher.status as PortalDenialReason };
  }

  return { ok: true, publisher };
}

/** Resolve access for the current request. Requires a live Supabase session. */
export async function getPortalAccess(): Promise<PortalAccess> {
  const authUserId = await getAuthUserId();
  return resolvePortalAccess(getRepositories().publishers, authUserId);
}

/**
 * The active publisher for this request, or an UnauthorizedError.
 *
 * Route handlers call this and pass `publisher.id` into the portal service. That id is
 * the ONLY publisher identifier any portal code should ever use.
 */
export async function requireActivePublisher(): Promise<Publisher> {
  const access = await getPortalAccess();
  if (!access.ok) {
    throw new UnauthorizedError(PORTAL_DENIAL_MESSAGE[access.reason], { reason: access.reason });
  }
  return access.publisher;
}
