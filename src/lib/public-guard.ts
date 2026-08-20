/**
 * Shared guards for public (unauthenticated) endpoints (Blueprint Sprint 6 security pass):
 * a per-IP rate limiter and client-IP extraction. Process-local; a shared store is a
 * future scaling step.
 */
import { type NextRequest } from 'next/server';
import { MemoryRateLimiter } from '@/src/lib/rate-limit';

/** 20 submissions / minute / IP across the public marketing forms. */
export const publicFormLimiter = new MemoryRateLimiter(20, 60_000);

export function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}
