/**
 * Minimal fixed-window rate limiter (Blueprint §4.1 — per-IP rate limit on public intake).
 *
 * Process-local; adequate for MVP. A shared store (Redis/Upstash) for multi-instance
 * correctness is a Phase 5 hardening item. `now` is injectable for deterministic tests.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class MemoryRateLimiter {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Record a hit for `key`; returns whether it is allowed under the current window. */
  check(key: string): RateLimitResult {
    const t = this.now();
    const existing = this.windows.get(key);
    if (!existing || t >= existing.resetAt) {
      const resetAt = t + this.windowMs;
      this.windows.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }
    existing.count += 1;
    const allowed = existing.count <= this.limit;
    return {
      allowed,
      remaining: Math.max(0, this.limit - existing.count),
      resetAt: existing.resetAt,
    };
  }
}
