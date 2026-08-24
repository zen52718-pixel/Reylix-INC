/**
 * Session / role helpers (Blueprint §"src/lib/auth.ts", §3.4).
 *
 * MVP uses a stateless, HMAC-signed session cookie ("or session" per the Sprint 4 spec).
 * The token payload is `{ userId, role, publisherId }`; it is signed with `SESSION_SECRET`
 * so it cannot be forged client-side. Supabase Auth can replace the issue/verify pair
 * behind this same interface in a later sprint without touching callers.
 *
 * Server-only (reads the secret + uses node:crypto).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { loadEnv } from '@/src/config/env';
import { UnauthorizedError } from '@/src/domain/errors';

export type Role = 'publisher' | 'admin';

export interface Session {
  userId: string;
  role: Role;
  publisherId?: string;
}

/** Minimal cookie accessor implemented by both NextRequest.cookies and next/headers cookies(). */
export interface CookieStore {
  get(name: string): { value: string } | undefined;
}

export const SESSION_COOKIE = 'rx_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function encodeSession(session: Session): string {
  const payload = base64url(JSON.stringify({ ...session, iat: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const obj = JSON.parse(base64urlDecode(payload)) as Partial<Session>;
    if (!obj.userId || (obj.role !== 'publisher' && obj.role !== 'admin')) return null;
    return { userId: obj.userId, role: obj.role, publisherId: obj.publisherId };
  } catch {
    return null;
  }
}

export function getSession(cookies: CookieStore): Session | null {
  return decodeSession(cookies.get(SESSION_COOKIE)?.value);
}

/** Require a publisher session; throws UnauthorizedError otherwise. Narrows publisherId to string. */
export function requirePublisher(cookies: CookieStore): Session & { publisherId: string } {
  const session = getSession(cookies);
  if (!session || session.role !== 'publisher' || !session.publisherId) {
    throw new UnauthorizedError('Publisher authentication required');
  }
  return session as Session & { publisherId: string };
}

/** Require an admin session; throws UnauthorizedError otherwise. */
export function requireAdmin(cookies: CookieStore): Session {
  const session = getSession(cookies);
  if (!session || session.role !== 'admin') {
    throw new UnauthorizedError('Admin authentication required');
  }
  return session;
}

/** Cookie options for setting/clearing the session cookie on a response. */
export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

// ── internals ───────────────────────────────────────────────────────────────

function sign(payload: string): string {
  return createHmac('sha256', loadEnv().SESSION_SECRET).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function base64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64urlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}
