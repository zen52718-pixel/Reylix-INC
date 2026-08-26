import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '@/src/domain/errors';
import { AuditService } from '@/src/services/AuditService';
import { CommissionService } from '@/src/services/CommissionService';
import { PublisherPortalService } from '@/src/services/PublisherPortalService';
import { seedAttributedLead, seedChain, type SeededChain } from '@/tests/support/fixtures';

function build(chain: SeededChain) {
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
  const commission = new CommissionService(
    chain.repos.leads,
    chain.repos.offers,
    chain.repos.commissions,
    chain.repos.leadAttributions,
    new AuditService(chain.repos.audit),
  );
  return { portal, commission };
}

describe('PublisherPortalService', () => {
  let chain: SeededChain;
  let svc: ReturnType<typeof build>;

  beforeEach(async () => {
    chain = await seedChain({ commissionAmount: 5000 });
    svc = build(chain);
  });

  it('rejects an unknown publisher', async () => {
    await expect(svc.portal.getProfile('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('reports earnings from commission records', async () => {
    const a = await seedAttributedLead(chain);
    const b = await seedAttributedLead(chain);
    await svc.commission.approve(a.lead.id, 'admin', 3000);
    const approvedB = await svc.commission.approve(b.lead.id, 'admin', 2000);
    await chain.repos.commissions.update(approvedB.commission!.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });

    const summary = await svc.portal.summary(chain.publisherId);
    expect(summary.leads).toBe(2);
    expect(summary.approved).toBe(2);
    expect(summary.commissionEarned).toBe(5000);
    expect(summary.paid).toBe(2000);
    expect(summary.unpaid).toBe(3000);
  });

  it('excludes voided commissions from earnings', async () => {
    const a = await seedAttributedLead(chain);
    const b = await seedAttributedLead(chain);
    await svc.commission.approve(a.lead.id, 'admin', 3000);
    await svc.commission.approve(b.lead.id, 'admin', 2000);
    await svc.commission.voidCommission(b.lead.id, 'admin', 'duplicate');

    const summary = await svc.portal.summary(chain.publisherId);
    // A voided commission is not an earning.
    expect(summary.commissionEarned).toBe(3000);
  });

  it('builds deterministic referral links and persists them lazily', async () => {
    const withLinks = await svc.portal.offersWithLinks(chain.publisherId);
    expect(withLinks).toHaveLength(1);
    expect(withLinks[0]?.refCode).toBe(chain.refCode);
    expect(withLinks[0]?.link).toBe(`https://go.reylix.com/r/${chain.refCode}`);

    // Calling again must not create a second link for the same publisher+offer.
    await svc.portal.offersWithLinks(chain.publisherId);
    expect(await chain.repos.referralLinks.listByPublisher(chain.publisherId)).toHaveLength(1);
  });

  it('updates only whitelisted profile/payout fields', async () => {
    const sneaky = {
      city: 'Austin',
      payoutMethod: 'ach',
      status: 'suspended',
      publisherCode: 'HACK',
      email: 'evil@x.com',
    } as Parameters<typeof svc.portal.updateAccount>[1];

    const updated = await svc.portal.updateAccount(chain.publisherId, sneaky);
    expect(updated.city).toBe('Austin');
    expect(updated.payoutMethod).toBe('ach');
    // Protected fields are ignored by the allowlist.
    expect(updated.status).toBe('active');
    expect(updated.publisherCode).toBe(chain.publisherCode);
    expect(updated.email).not.toBe('evil@x.com');
  });
});
