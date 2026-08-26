/**
 * Step 2 migration proofs.
 *
 * These assert the properties the approved design exists to guarantee. They are grouped
 * here rather than scattered so that a future change which quietly undoes one of them
 * fails against a suite whose name says exactly what was lost.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AuditService } from '@/src/services/AuditService';
import { CommissionService } from '@/src/services/CommissionService';
import { PublisherPortalService } from '@/src/services/PublisherPortalService';
import { seedAttributedLead, seedChain, type SeededChain } from '@/tests/support/fixtures';

function commissionService(chain: SeededChain) {
  return new CommissionService(
    chain.repos.leads,
    chain.repos.offers,
    chain.repos.commissions,
    chain.repos.leadAttributions,
    new AuditService(chain.repos.audit),
  );
}

function portal(chain: SeededChain) {
  return new PublisherPortalService(
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
}

/** Every .ts file under a directory, recursively. */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

/**
 * Strip comments so the scan below tests CODE rather than prose.
 *
 * The domain deliberately explains the old vocabulary in a doc comment — that a "Buyer"
 * now means a consumer purchasing a property is exactly the confusion this migration
 * exists to prevent, and deleting the explanation to satisfy a regex would make the
 * codebase worse.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('1 · Client replaces Buyer', () => {
  it('no executable code in the platform references "buyer"', () => {
    // The single check that proves the rename is COMPLETE rather than mostly complete.
    // The public website is excluded: its user-facing wording is deliberately unchanged.
    const offenders = walk(join(process.cwd(), 'src'))
      .filter((file) => /buyer/i.test(stripComments(readFileSync(file, 'utf8'))))
      .map((file) => file.replace(process.cwd(), ''));

    expect(offenders).toEqual([]);
  });

  it('no migration or adapter still targets a `buyers` table', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase', 'migrations', '0002_step2_domain.sql'),
      'utf8',
    );
    // 0002 may name `buyers` only to rename it away.
    expect(sql).toContain('rename to clients');
    const adapters = walk(join(process.cwd(), 'src', 'repositories'));
    for (const file of adapters) {
      expect(stripComments(readFileSync(file, 'utf8'))).not.toMatch(/['"]buyers['"]/);
    }
  });

  it('a Client carries the fields the old Buyer carried', async () => {
    const chain = await seedChain();
    const client = await chain.repos.clients.getById(chain.clientId);
    expect(client).toMatchObject({
      company: expect.any(String),
      contactName: expect.any(String),
      contactEmail: expect.any(String),
      status: 'active',
    });
  });
});

describe('2 · Inquiry is separate from Lead', () => {
  it('an inquiry has no attribution, offer, client or commission', async () => {
    const chain = await seedChain();
    const inquiry = await chain.repos.inquiries.append({
      name: 'Jane',
      email: 'jane@example.com',
      interestType: 'client',
      consentGranted: true,
      handled: false,
      createdAt: new Date().toISOString(),
    });

    const keys = Object.keys(inquiry);
    for (const forbidden of ['publisherId', 'offerId', 'clientId', 'refCode', 'campaignId']) {
      expect(keys).not.toContain(forbidden);
    }
    expect(await chain.repos.leads.list()).toHaveLength(0);
  });

  it('a lead has the acquisition fields an inquiry lacks', async () => {
    const chain = await seedChain();
    const { lead } = await seedAttributedLead(chain);
    expect(lead.clientId).toBe(chain.clientId);
    expect(lead.offerId).toBe(chain.offerId);
    expect(Object.keys(lead)).not.toContain('interestType');
  });
});

describe('3 · Product is client-agnostic', () => {
  it('a product carries no client reference and serves many clients', async () => {
    const chain = await seedChain();
    const product = await chain.repos.products.getById(chain.productId);
    expect(Object.keys(product!)).not.toContain('clientId');

    // A second client, on the SAME product, via a second offer.
    const other = await chain.repos.clients.create({
      company: 'Second Realtor',
      contactName: 'B',
      contactEmail: 'b@example.com',
      status: 'active',
    });
    await chain.repos.offers.create({
      campaignId: chain.campaignId,
      clientId: other.id,
      offerCode: 'SECOND1',
      name: 'Second offer',
      destinationUrl: 'https://example.com',
      commissionModel: 'flat',
      commissionAmount: 100,
      currency: 'USD',
      isActive: true,
    });

    const campaigns = await chain.repos.campaigns.listByProduct(chain.productId);
    const offers = await chain.repos.offers.listByCampaign(campaigns[0]!.id);
    expect(new Set(offers.map((o) => o.clientId)).size).toBe(2);
  });
});

describe('4 · Offer identifies its client', () => {
  it('the client is reachable from the offer and from nothing above it', async () => {
    const chain = await seedChain();
    const offer = await chain.repos.offers.getById(chain.offerId);
    expect(offer?.clientId).toBe(chain.clientId);
    expect(await chain.repos.offers.listByClient(chain.clientId)).toHaveLength(1);

    const campaign = await chain.repos.campaigns.getById(chain.campaignId);
    expect(Object.keys(campaign!)).not.toContain('clientId');
  });
});

describe('5 · Attribution identifies publisher and client', () => {
  it('one row answers who is credited and who receives the lead', async () => {
    const chain = await seedChain();
    const { lead, attribution } = await seedAttributedLead(chain);

    const current = await chain.repos.leadAttributions.getCurrentForLead(lead.id);
    expect(current?.id).toBe(attribution.id);
    expect(current?.publisherId).toBe(chain.publisherId);
    expect(current?.clientId).toBe(chain.clientId);
    expect(current?.offerId).toBe(chain.offerId);
  });
});

describe('6 · Commission follows the attribution and the client', () => {
  it('commission is created for the attributed publisher and the offer client', async () => {
    const chain = await seedChain({ commissionAmount: 5000 });
    const { lead, attribution } = await seedAttributedLead(chain);

    const { commission } = await commissionService(chain).approve(lead.id, 'admin@reylix.com');
    expect(commission?.publisherId).toBe(attribution.publisherId);
    expect(commission?.clientId).toBe(chain.clientId);
    expect(commission?.offerId).toBe(chain.offerId);
    expect(commission?.leadId).toBe(lead.id);
  });

  it('no attribution means no commission, even on an approved lead', async () => {
    const chain = await seedChain();
    const lead = await chain.repos.leads.append({
      publisherId: null,
      offerId: chain.offerId,
      clientId: chain.clientId,
      productId: chain.productId,
      campaignId: chain.campaignId,
      refCode: null,
      status: 'new',
      capturedData: {},
      createdAt: new Date().toISOString(),
    });
    const { commission } = await commissionService(chain).approve(lead.id, 'admin@reylix.com');
    expect(commission).toBeNull();
  });
});

describe('7 · Dedup config lives on the commercial layer', () => {
  it('the window is configurable on the offer and the campaign, not hard-coded', async () => {
    const chain = await seedChain({
      leadDedupWindowMinutes: 120,
      campaignDedupWindowMinutes: 60,
    });

    const offer = await chain.repos.offers.getById(chain.offerId);
    const campaign = await chain.repos.campaigns.getById(chain.campaignId);
    expect(offer?.leadDedupWindowMinutes).toBe(120);
    expect(campaign?.leadDedupWindowMinutes).toBe(60);
  });

  it('no default is invented when nothing is configured', async () => {
    const chain = await seedChain();
    const offer = await chain.repos.offers.getById(chain.offerId);
    const campaign = await chain.repos.campaigns.getById(chain.campaignId);
    // Guessing this value would silently change what a publisher is paid.
    expect(offer?.leadDedupWindowMinutes).toBeUndefined();
    expect(campaign?.leadDedupWindowMinutes).toBeUndefined();
  });

  it('the window is not a property of the product', async () => {
    const chain = await seedChain();
    const product = await chain.repos.products.getById(chain.productId);
    expect(Object.keys(product!)).not.toContain('leadDedupWindowMinutes');
  });
});

describe('8 · Publisher isolation through the service layer', () => {
  it('a publisher cannot reach another publisher through portal methods', async () => {
    const chain = await seedChain({ commissionAmount: 5000 });
    const intruder = await chain.repos.publishers.create({
      publisherCode: 'INTRUDER',
      fullName: 'Intruder',
      email: 'intruder@example.com',
      phone: '+15550000001',
      status: 'active',
    });

    const { lead } = await seedAttributedLead(chain);
    await commissionService(chain).approve(lead.id, 'admin@reylix.com');

    const p = portal(chain);

    // The victim sees their own data.
    expect(await p.leads(chain.publisherId)).toHaveLength(1);
    expect((await p.summary(chain.publisherId)).commissionEarned).toBe(5000);

    // The intruder sees nothing, because publisherId is a required argument taken from
    // the session — never from caller-supplied input.
    expect(await p.leads(intruder.id)).toHaveLength(0);
    expect(await p.links(intruder.id)).toHaveLength(0);
    const intruderSummary = await p.summary(intruder.id);
    expect(intruderSummary.leads).toBe(0);
    expect(intruderSummary.commissionEarned).toBe(0);
    expect(intruderSummary.paid).toBe(0);
  });

  it('a caller-supplied publisherId in a filter cannot widen the scope', async () => {
    const chain = await seedChain();
    const intruder = await chain.repos.publishers.create({
      publisherCode: 'INTRUDER2',
      fullName: 'Intruder',
      email: 'intruder2@example.com',
      phone: '+15550000002',
      status: 'active',
    });
    await seedAttributedLead(chain);

    // The filter argument has no publisherId member to abuse; scope comes from the first
    // parameter only.
    const leaked = await portal(chain).leads(intruder.id, { status: 'new' });
    expect(leaked).toHaveLength(0);
  });
});
