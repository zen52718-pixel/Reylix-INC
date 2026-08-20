import { describe, expect, it, vi } from 'vitest';
import { MemoryIdempotencyStore, runIdempotent } from '@/src/lib/idempotency';

describe('MemoryIdempotencyStore', () => {
  it('stores and returns a result id within TTL, expiring afterwards', async () => {
    let now = 0;
    const store = new MemoryIdempotencyStore(1000, () => now);
    await store.set('k', 'lead-1');
    expect(await store.get('k')).toBe('lead-1');
    now = 1000;
    expect(await store.get('k')).toBeNull();
  });
});

describe('runIdempotent', () => {
  it('runs the operation once per key and replays the stored result on retry', async () => {
    const store = new MemoryIdempotencyStore();
    const op = vi.fn(async () => 'lead-1');

    const first = await runIdempotent(store, 'key-1', op);
    expect(first).toEqual({ resultId: 'lead-1', replayed: false });

    const second = await runIdempotent(store, 'key-1', op);
    expect(second).toEqual({ resultId: 'lead-1', replayed: true });
    expect(op).toHaveBeenCalledTimes(1); // not run again
  });

  it('always runs when no key is provided', async () => {
    const store = new MemoryIdempotencyStore();
    const op = vi.fn(async () => 'x');
    await runIdempotent(store, undefined, op);
    await runIdempotent(store, undefined, op);
    expect(op).toHaveBeenCalledTimes(2);
  });
});
