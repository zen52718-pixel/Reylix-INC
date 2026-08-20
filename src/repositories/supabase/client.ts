/**
 * Supabase client construction — adapter-internal.
 *
 * Two clients, two trust levels:
 *  - service-role: SERVER-ONLY, bypasses RLS. Used by the repository adapter for admin
 *    operations and for writes the app performs on the user's behalf.
 *  - user-scoped: the anon key plus the caller's access token, so every query runs as
 *    that Supabase Auth user and RLS is genuinely enforced by the database.
 *
 * Nothing outside this folder may import this module — the ESLint import-boundary rule
 * keeps domain and services away from the SDK.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/src/config/env';

let serviceClient: SupabaseClient | null = null;

/** Server-only client that bypasses RLS. Never expose this to the browser. */
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const { url, serviceRoleKey } = supabaseConfig();
    serviceClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

/** Client bound to a signed-in user's access token; all queries are subject to RLS. */
export function getUserClient(accessToken: string): SupabaseClient {
  const { url, anonKey } = supabaseConfig();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
  });
}

/** Test-only: drop the cached service client so the next call rebuilds it. */
export function __resetSupabaseClient(): void {
  serviceClient = null;
}
