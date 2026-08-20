/**
 * Adapter-internal helpers: turn PostgREST responses into domain values or domain errors.
 *
 * Every Supabase call funnels through here so that a database failure surfaces as a
 * DomainError (which controllers already know how to map to HTTP) rather than leaking a
 * driver-shaped object into the service layer.
 */
import type { PostgrestError } from '@supabase/supabase-js';
import { DomainError, NotFoundError } from '@/src/domain/errors';
import type { Row } from '@/src/repositories/supabase/mappers';

/** PostgREST code for "no rows returned" from .single() — an expected miss, not a failure. */
const NO_ROWS = 'PGRST116';

export interface PgResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

function fail(error: PostgrestError, context: string): never {
  throw new DomainError('INTERNAL', `${context}: ${error.message}`, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

/** A list query. Returns [] rather than null when the table is empty. */
export function rows<T extends Row>(res: PgResult<T[]>, context: string): T[] {
  if (res.error) fail(res.error, context);
  return res.data ?? [];
}

/** A .single() lookup that is allowed to miss. */
export function maybeRow<T extends Row>(res: PgResult<T>, context: string): T | null {
  if (res.error) {
    if (res.error.code === NO_ROWS) return null;
    fail(res.error, context);
  }
  return res.data ?? null;
}

/** A .single() lookup that must hit — a miss is a NotFoundError. */
export function requireRow<T extends Row>(res: PgResult<T>, context: string, id: string): T {
  const row = maybeRow(res, context);
  if (!row) throw new NotFoundError(`${context}: ${id} not found`, { id });
  return row;
}
