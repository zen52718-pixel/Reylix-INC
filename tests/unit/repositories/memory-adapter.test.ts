import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '@/src/domain/errors';
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { createMemoryRepositories } from '@/src/repositories/memory';

describe('memory adapter', () => {
  let repos: RepositoryBundle;

  beforeEach(() => {
    repos = createMemoryRepositories();
  });

  it('creates and reads back a publisher by id and code', async () => {
    const created = await repos.publishers.create({
      publisherCode: 'AHMED',
      fullName: 'Ahmed Khan',
      email: 'ahmed@example.com',
      phone: '+15551234567',
      status: 'pending',
    });

    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(await repos.publishers.getById(created.id)).toEqual(created);
    expect(await repos.publishers.getByCode('ahmed')).toEqual(created); // case-insensitive
  });

  it('lists only active offers', async () => {
    await repos.offers.create({
      buyerId: 'buyer-1',
      offerCode: 'MVA1',
      name: 'Motor Vehicle Accident',
      destinationUrl: 'https://lawcaseconnect.com',
      commissionAmount: 5000,
      currency: 'USD',
      isActive: true,
    });
    await repos.offers.create({
      buyerId: 'buyer-1',
      offerCode: 'OLD1',
      name: 'Retired offer',
      destinationUrl: 'https://example.com',
      commissionAmount: 0,
      currency: 'USD',
      isActive: false,
    });

    const active = await repos.offers.listActive();
    expect(active).toHaveLength(1);
    expect(active[0]?.offerCode).toBe('MVA1');
  });

  it('dedups clicks within the window but not outside it', async () => {
    // Use an explicitly old click so the assertions are independent of execution speed.
    const sixtySecondsAgo = Date.now() - 60_000;
    await repos.clicks.append({
      refCode: 'AHMED-MVA1',
      publisherId: 'p1',
      offerId: 'o1',
      clickedAt: new Date(sixtySecondsAgo).toISOString(),
      dedupKey: 'key-1',
      isUnique: true,
    });

    // a 2-minute window includes a 60s-old click...
    expect(await repos.clicks.recentDedup('key-1', 2 * 60 * 1000)).toBe(true);
    // ...a 30-second window does not.
    expect(await repos.clicks.recentDedup('key-1', 30 * 1000)).toBe(false);
    // an unknown dedup key never matches.
    expect(await repos.clicks.recentDedup('other', 2 * 60 * 1000)).toBe(false);
  });

  it('appends a lead and updates its status in place', async () => {
    const lead = await repos.leads.append({
      publisherId: 'p1',
      offerId: 'o1',
      refCode: 'AHMED-MVA1',
      buyerId: 'buyer-1',
      attributionSource: 'param',
      status: 'new',
      commissionAmount: 0,
      capturedData: { name: 'Test', phone: '555' },
      createdAt: new Date().toISOString(),
    });

    const approved = await repos.leads.updateStatus(lead.id, 'approved', {
      commissionAmount: 5000,
      approvedAt: new Date().toISOString(),
    });

    expect(approved.status).toBe('approved');
    expect(approved.commissionAmount).toBe(5000);

    const onlyApproved = await repos.leads.list({ status: 'approved' });
    expect(onlyApproved).toHaveLength(1);
  });

  it('throws NotFoundError when updating a missing row', async () => {
    await expect(repos.publishers.update('nope', { status: 'active' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
