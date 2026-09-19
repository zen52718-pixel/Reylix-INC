/**
 * Supabase Auth server client.
 *
 * SERVER ONLY. Lives in `src/lib` rather than `src/services` because it imports the
 * Supabase SDK, and the ESLint import boundary forbids business logic from touching a
 * vendor SDK directly.
 *
 * This client is built on the ANON key and the request's cookies, so every call it makes
 * runs as the signed-in user with RLS applied. It is deliberately NOT the service-role
 * client used by the repository adapter — that one bypasses RLS and must never be used
 * to establish who someone is.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStorageBackend, supabaseConfig } from '@/src/config/env';

/**
 * Build a request-scoped Supabase client that reads and writes the auth cookies.
 *
 * Async because `cookies()` returns a promise from Next 15 onward: request data is awaited
 * so a page can start rendering before the request is fully resolved.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = supabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. Refreshing the
          // session is middleware's job; failing to write here is expected, not an error.
        }
      },
    },
  });
}

/**
 * The authenticated Supabase user id, or null.
 *
 * Uses `getUser()` rather than `getSession()` on purpose: `getSession()` returns whatever
 * is in the cookie without checking it, while `getUser()` verifies the token with the auth
 * server. Identity that decides authorization must be verified, not read.
 *
 * Returns null — rather than throwing — when Supabase is not configured, so a local
 * memory-backend environment simply denies portal access instead of erroring.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (getStorageBackend() !== 'supabase') return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
