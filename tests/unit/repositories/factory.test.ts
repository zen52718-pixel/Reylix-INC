import { describe, expect, it } from 'vitest';
import { buildRepositories } from '@/src/repositories/index';
import type { RepositoryBundle } from '@/src/repositories/interfaces';

const ALL_KEYS: (keyof RepositoryBundle)[] = [
  'buyers',
  'publishers',
  'offers',
  'referralLinks',
  'clicks',
  'leads',
  'payouts',
  'audit',
  'contacts',
];

describe('repository factory', () => {
  // Binding a bundle must not require credentials: the Supabase repos resolve their
  // client lazily, on first query. That keeps `next build` and unit tests working with
  // no secrets present.
  it.each(['memory', 'supabase'] as const)(
    'binds a complete bundle for STORAGE_BACKEND=%s',
    (backend) => {
      const repos = buildRepositories(backend);
      for (const key of ALL_KEYS) expect(repos[key]).toBeDefined();
    },
  );
});
