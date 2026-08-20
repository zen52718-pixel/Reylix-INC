/**
 * Repository factory — the ONE place the storage backend is named.
 *
 * Migrating storage = implement the adapter + flip STORAGE_BACKEND. No service,
 * controller, or UI code changes. Both adapters are wired: memory (dev/tests) and
 * supabase (production). Each satisfies the same interfaces and passes the shared
 * adapter contract test.
 */
import { loadEnv, type StorageBackend } from '@/src/config/env';
import { NotImplementedError } from '@/src/domain/errors';
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { createMemoryRepositories } from '@/src/repositories/memory';
import { createSupabaseRepositories } from '@/src/repositories/supabase';

let bundle: RepositoryBundle | null = null;

/** Application-wide singleton bundle for the configured backend. */
export function getRepositories(): RepositoryBundle {
  if (!bundle) bundle = buildRepositories();
  return bundle;
}

/** Build a fresh bundle for a given backend (defaults to the configured one). */
export function buildRepositories(
  backend: StorageBackend = loadEnv().STORAGE_BACKEND,
): RepositoryBundle {
  switch (backend) {
    case 'memory':
      return createMemoryRepositories();
    case 'supabase':
      return createSupabaseRepositories();
    default: {
      const exhaustive: never = backend;
      throw new NotImplementedError('Unknown STORAGE_BACKEND: ' + String(exhaustive));
    }
  }
}

/** Test-only: clear the cached singleton so a later call rebuilds it. */
export function __resetRepositories(): void {
  bundle = null;
}
