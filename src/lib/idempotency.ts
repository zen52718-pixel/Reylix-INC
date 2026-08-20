/**
 * Idempotency foundation (Addendum §11.2 / §4.4). Write endpoints accept an
 * `Idempotency-Key`; before performing a write the handler checks whether that key has
 * already produced a result and, if so, returns it instead of writing again — surviving
 * client retries and Sheets API timeouts.
 *
 * Sprint 1 provides the store + the `runIdempotent` helper. Wiring into write routes
 * happens in the sprints that add those routes (lead capture, admin mutations).
 */

export interface IdempotencyStore {
  /** Return the previously stored result id for `key`, or null if unseen/expired. */
  get(key: string): Promise<string | null>;
  /** Remember that `key` produced `resultId`. */
  set(key: string, resultId: string, ttlMs?: number): Promise<void>;
}

/** Process-local store with TTL. Adequate for MVP; swap for a shared KV at scale. */
export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, { resultId: string; expiresAt: number }>();

  constructor(
    private readonly defaultTtlMs = 24 * 60 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (this.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    return entry.resultId;
  }

  async set(key: string, resultId: string, ttlMs?: number): Promise<void> {
    this.entries.set(key, { resultId, expiresAt: this.now() + (ttlMs ?? this.defaultTtlMs) });
  }
}

/**
 * Run `operation` at most once per `key`. If the key was already used, returns the
 * remembered result id without running again. When `key` is undefined, always runs
 * (no idempotency guarantee).
 */
export async function runIdempotent(
  store: IdempotencyStore,
  key: string | undefined,
  operation: () => Promise<string>,
  ttlMs?: number,
): Promise<{ resultId: string; replayed: boolean }> {
  if (!key) {
    return { resultId: await operation(), replayed: false };
  }
  const existing = await store.get(key);
  if (existing !== null) {
    return { resultId: existing, replayed: true };
  }
  const resultId = await operation();
  await store.set(key, resultId, ttlMs);
  return { resultId, replayed: false };
}
