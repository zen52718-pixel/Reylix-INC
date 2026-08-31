/**
 * Portal authorization — the eight required security proofs.
 *
 * These exercise the real decision function, not a mock of it. `resolvePortalAccess` is
 * pure over a repository precisely so that every access rule can be proven before a
 * Supabase project exists; only the session-reading shell needs a live project.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UnauthorizedError } from '@/src/domain/errors';
import type { Publisher, PublisherStatus } from '@/src/domain/types';
import { __resetEnv } from '@/src/config/env';
import { __resetRepositories } from '@/src/repositories';
import { createMemoryRepositories } from '@/src/repositories/memory';
import {
  PORTAL_DENIAL_MESSAGE,
  requireActivePublisher,
  resolvePortalAccess,
} from '@/src/lib/portal-auth';
import { PublisherPortalService } from '@/src/services/PublisherPortalService';
import { seedAttributedLead, seedChain, type SeededChain } from '@/tests/support/fixtures';

const repos = () => createMemoryRepositories();

async function makePublisher(
  bundle: ReturnType<typeof createMemoryRepositories>,
  status: PublisherStatus,
  authUserId: string,
  code = 'PUB1',
): Promise<Publisher> {
  return bundle.publishers.create({
    publisherCode: code,
    fullName: 'Test Publisher',
    email: `${code.toLowerCase()}@example.com`,
    phone: '+15551234567',
    status,
    authUserId,
  });
}

beforeEach(() => {
  process.env.STORAGE_BACKEND = 'memory';
  __resetEnv();
  __resetRepositories();
});

afterEach(() => {
  __resetEnv();
  __resetRepositories();
});

describe('1 · Unauthenticated requests cannot reach publisher resources', () => {
  it('a request with no verified session is denied', async () => {
    const bundle = repos();
    await makePublisher(bundle, 'active', 'auth-1');

    const access = await resolvePortalAccess(bundle.publishers, null);
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.reason).toBe('no_session');
  });

  it('an auth user with no linked publisher is denied', async () => {
    const bundle = repos();
    const access = await resolvePortalAccess(bundle.publishers, 'auth-unknown');
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.reason).toBe('no_publisher');
  });

  it('the two are indistinguishable to the caller, so a valid account is not confirmed', () => {
    expect(PORTAL_DENIAL_MESSAGE.no_session).toBe(PORTAL_DENIAL_MESSAGE.no_publisher);
  });

  it('with Supabase not configured, the portal is closed rather than open', async () => {
    // Fails safe: no live auth means no access, not unguarded access.
    await expect(requireActivePublisher()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('2 · Publisher A cannot reach Publisher B', () => {
  it('an auth user resolves to their own publisher and no other', async () => {
    const bundle = repos();
    const a = await makePublisher(bundle, 'active', 'auth-a', 'PUBA');
    const b = await makePublisher(bundle, 'active', 'auth-b', 'PUBB');

    const accessA = await resolvePortalAccess(bundle.publishers, 'auth-a');
    const accessB = await resolvePortalAccess(bundle.publishers, 'auth-b');

    expect(accessA.ok && accessA.publisher.id).toBe(a.id);
    expect(accessB.ok && accessB.publisher.id).toBe(b.id);
    expect(a.id).not.toBe(b.id);
  });

  it('scoped service reads return nothing for the other publisher', async () => {
    const chain: SeededChain = await seedChain();
    await seedAttributedLead(chain);
    const intruder = await chain.repos.publishers.create({
      publisherCode: 'INTRUDER',
      fullName: 'Intruder',
      email: 'intruder@example.com',
      phone: '+15550000000',
      status: 'active',
      authUserId: 'auth-intruder',
    });

    const portal = new PublisherPortalService(
      {
        publishers: chain.repos.publishers,
        offers: chain.repos.offers,
        leads: chain.repos.leads,
        clicks: chain.repos.clicks,
        referralLinks: chain.repos.referralLinks,
        commissions: chain.repos.commissions,
      },
      { redirectBaseUrl: 'https://go.reylix.com' },
    );

    expect(await portal.leads(chain.publisherId)).toHaveLength(1);
    expect(await portal.leads(intruder.id)).toHaveLength(0);
  });
});

describe('3–5 · Non-active statuses are refused', () => {
  it.each([
    ['pending', 'pending'],
    ['rejected', 'rejected'],
    ['suspended', 'suspended'],
  ] as const)('a %s publisher cannot access the portal', async (status, reason) => {
    const bundle = repos();
    await makePublisher(bundle, status, `auth-${status}`);

    const access = await resolvePortalAccess(bundle.publishers, `auth-${status}`);
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.reason).toBe(reason);
  });

  it('each refusal carries a distinct, actionable message', () => {
    const messages = [
      PORTAL_DENIAL_MESSAGE.pending,
      PORTAL_DENIAL_MESSAGE.rejected,
      PORTAL_DENIAL_MESSAGE.suspended,
    ];
    expect(new Set(messages).size).toBe(3);
  });

  it('a publisher suspended after approval loses access immediately', async () => {
    const bundle = repos();
    const p = await makePublisher(bundle, 'active', 'auth-x');
    expect((await resolvePortalAccess(bundle.publishers, 'auth-x')).ok).toBe(true);

    await bundle.publishers.update(p.id, { status: 'suspended' });
    const after = await resolvePortalAccess(bundle.publishers, 'auth-x');
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.reason).toBe('suspended');
  });
});

describe('6 · An active publisher can access their own resources', () => {
  it('resolves to the linked publisher', async () => {
    const bundle = repos();
    const p = await makePublisher(bundle, 'active', 'auth-ok');
    const access = await resolvePortalAccess(bundle.publishers, 'auth-ok');
    expect(access.ok).toBe(true);
    if (access.ok) {
      expect(access.publisher.id).toBe(p.id);
      expect(access.publisher.status).toBe('active');
    }
  });
});

describe('7 · publisher_id cannot be overridden through request input', () => {
  it('access is decided from the auth user id alone', async () => {
    const bundle = repos();
    const victim = await makePublisher(bundle, 'active', 'auth-victim', 'VICTIM');
    await makePublisher(bundle, 'active', 'auth-attacker', 'ATTACKER');

    // The only input the decision accepts is the verified auth user id. There is no
    // parameter through which a caller could name a different publisher.
    const access = await resolvePortalAccess(bundle.publishers, 'auth-attacker');
    expect(access.ok && access.publisher.id).not.toBe(victim.id);
  });

  it('a publisher without a linked auth user cannot be reached by guessing an id', async () => {
    const bundle = repos();
    const orphan = await bundle.publishers.create({
      publisherCode: 'ORPHAN',
      fullName: 'No auth link',
      email: 'orphan@example.com',
      phone: '+15550000001',
      status: 'active',
    });

    // No auth_user_id means no route in — the publisher id itself is not a credential.
    const byId = await resolvePortalAccess(bundle.publishers, orphan.id);
    expect(byId.ok).toBe(false);
    if (!byId.ok) expect(byId.reason).toBe('no_publisher');
  });
});

describe('8 · Admin authorization is separate from publisher authorization', () => {
  it('being on the admin allow-list grants no portal access', async () => {
    process.env.ADMIN_EMAILS = 'boss@reylix.com';
    __resetEnv();

    const bundle = repos();
    await bundle.publishers.create({
      publisherCode: 'BOSS',
      fullName: 'Boss',
      email: 'boss@reylix.com',
      phone: '+15550000002',
      status: 'pending',
      authUserId: 'auth-boss',
    });

    // Admin standing lives in ADMIN_EMAILS and public.admin_users. Portal standing lives
    // in publisher status. Neither implies the other.
    const access = await resolvePortalAccess(bundle.publishers, 'auth-boss');
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.reason).toBe('pending');
  });

  it('an active publisher is not made an admin by having a portal session', async () => {
    process.env.ADMIN_EMAILS = '';
    __resetEnv();

    const bundle = repos();
    await makePublisher(bundle, 'active', 'auth-pub');
    const access = await resolvePortalAccess(bundle.publishers, 'auth-pub');

    expect(access.ok).toBe(true);
    // Nothing in the portal access result confers admin rights.
    expect(Object.keys(access)).not.toContain('isAdmin');
  });
});
