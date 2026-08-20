import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '@/src/domain/errors';
import {
  decodeSession,
  encodeSession,
  requirePublisher,
  SESSION_COOKIE,
  type CookieStore,
} from '@/src/lib/auth';

function cookieStore(token?: string): CookieStore {
  return { get: (name) => (name === SESSION_COOKIE && token ? { value: token } : undefined) };
}

describe('session encode/decode', () => {
  it('round-trips a publisher session', () => {
    const token = encodeSession({ userId: 'u1', role: 'publisher', publisherId: 'p1' });
    expect(decodeSession(token)).toEqual({ userId: 'u1', role: 'publisher', publisherId: 'p1' });
  });

  it('rejects a tampered payload', () => {
    const token = encodeSession({ userId: 'u1', role: 'publisher', publisherId: 'p1' });
    const [payload, sig] = token.split('.');
    // Flip the role in the payload but keep the old signature.
    const forged = Buffer.from(JSON.stringify({ userId: 'u1', role: 'admin', publisherId: 'p1' })).toString(
      'base64url',
    );
    expect(decodeSession(`${forged}.${sig}`)).toBeNull();
    expect(decodeSession(`${payload}.deadbeef`)).toBeNull();
    expect(decodeSession(undefined)).toBeNull();
  });
});

describe('requirePublisher', () => {
  it('returns the session for a valid publisher cookie', () => {
    const token = encodeSession({ userId: 'u1', role: 'publisher', publisherId: 'p1' });
    expect(requirePublisher(cookieStore(token)).publisherId).toBe('p1');
  });

  it('throws UnauthorizedError without a session', () => {
    expect(() => requirePublisher(cookieStore())).toThrow(UnauthorizedError);
  });

  it('throws for an admin session (wrong role)', () => {
    const token = encodeSession({ userId: 'admin', role: 'admin' });
    expect(() => requirePublisher(cookieStore(token))).toThrow(UnauthorizedError);
  });
});
