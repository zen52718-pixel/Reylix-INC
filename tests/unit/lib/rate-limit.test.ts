import { describe, expect, it } from 'vitest';
import { MemoryRateLimiter } from '@/src/lib/rate-limit';

describe('MemoryRateLimiter', () => {
  it('allows up to the limit then blocks within the window', () => {
    let now = 0;
    const rl = new MemoryRateLimiter(3, 1000, () => now);
    expect(rl.check('ip').allowed).toBe(true); // 1
    expect(rl.check('ip').allowed).toBe(true); // 2
    expect(rl.check('ip').allowed).toBe(true); // 3
    expect(rl.check('ip').allowed).toBe(false); // 4 — over
  });

  it('resets after the window elapses', () => {
    let now = 0;
    const rl = new MemoryRateLimiter(1, 1000, () => now);
    expect(rl.check('ip').allowed).toBe(true);
    expect(rl.check('ip').allowed).toBe(false);
    now = 1000; // new window
    expect(rl.check('ip').allowed).toBe(true);
  });

  it('tracks keys independently', () => {
    const rl = new MemoryRateLimiter(1, 1000);
    expect(rl.check('a').allowed).toBe(true);
    expect(rl.check('b').allowed).toBe(true);
    expect(rl.check('a').allowed).toBe(false);
  });
});
