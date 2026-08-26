/**
 * Shared test fixtures.
 *
 * The domain now has a real hierarchy — Product → Campaign → Offer → Client — so nearly
 * every test needs the same chain seeded. Building it here once keeps the suites about
 * behaviour rather than about setup, and means a change to the hierarchy is a change to
 * one file.
 *
 * Not a test file: vitest only collects `tests/**\/*.test.ts`.
 */
import { randomUUID } from 'node:crypto';
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { createMemoryRepositories } from '@/src/repositories/memory';

export interface SeededChain {
  repos: RepositoryBundle;
  tag: string;
  productId: string;
  campaignId: string;
  clientId: string;
  offerId: string;
  offerCode: string;
  publisherId: string;
  publisherCode: string;
  refCode: string;
}

export interface SeedOptions {
  repos?: RepositoryBundle;
  commissionAmount?: number;
  commissionModel?: 'flat' | 'cpl' | 'cpa' | 'cpq' | 'revshare' | 'custom';
  /** Consumer de-duplication window. Left unset by default — no business value is assumed. */
  leadDedupWindowMinutes?: number;
  campaignDedupWindowMinutes?: number;
  offerActive?: boolean;
}

/** Seed a complete, uniquely-tagged Product → Campaign → Client → Offer → Publisher chain. */
export async function seedChain(opts: SeedOptions = {}): Promise<SeededChain> {
  const repos = opts.repos ?? createMemoryRepositories();
  const tag = randomUUID().slice(0, 8).toUpperCase();

  const product = await repos.products.create({
    slug: `real-estate-${tag.toLowerCase()}`,
    name: 'Real Estate',
    status: 'in_development',
  });

  const campaign = await repos.campaigns.create({
    productId: product.id,
    slug: `rochester-${tag.toLowerCase()}`,
    name: 'Rochester',
    market: 'Rochester, NY',
    leadDedupWindowMinutes: opts.campaignDedupWindowMinutes,
    isActive: true,
  });

  const client = await repos.clients.create({
    company: `Client ${tag}`,
    contactName: 'QA Contact',
    contactEmail: `client-${tag}@example.com`,
    status: 'active',
  });

  const offerCode = `OF${tag}`;
  const offer = await repos.offers.create({
    campaignId: campaign.id,
    clientId: client.id,
    offerCode,
    name: 'QA Offer',
    destinationUrl: 'https://example.com',
    commissionModel: opts.commissionModel ?? 'flat',
    commissionAmount: opts.commissionAmount ?? 5000,
    currency: 'USD',
    leadDedupWindowMinutes: opts.leadDedupWindowMinutes,
    isActive: opts.offerActive ?? true,
  });

  const publisherCode = `QA${tag}`;
  const publisher = await repos.publishers.create({
    publisherCode,
    fullName: 'QA Publisher',
    email: `pub-${tag}@example.com`,
    phone: '+15551234567',
    status: 'active',
  });

  return {
    repos,
    tag,
    productId: product.id,
    campaignId: campaign.id,
    clientId: client.id,
    offerId: offer.id,
    offerCode,
    publisherId: publisher.id,
    publisherCode,
    refCode: `${publisherCode}-${offerCode}`,
  };
}

/** Append a consumer lead already attributed to the seeded publisher. */
export async function seedAttributedLead(
  chain: SeededChain,
  overrides: { status?: 'new' | 'approved'; createdAt?: string } = {},
) {
  const lead = await chain.repos.leads.append({
    publisherId: chain.publisherId,
    offerId: chain.offerId,
    clientId: chain.clientId,
    productId: chain.productId,
    campaignId: chain.campaignId,
    refCode: chain.refCode,
    status: overrides.status ?? 'new',
    capturedData: { name: 'Sara' },
    customerName: 'Sara',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    ...(overrides.status === 'approved' ? { approvedAt: new Date().toISOString() } : {}),
  });

  const attribution = await chain.repos.leadAttributions.append({
    leadId: lead.id,
    publisherId: chain.publisherId,
    offerId: chain.offerId,
    clientId: chain.clientId,
    source: 'param',
    attributedAt: new Date().toISOString(),
  });

  return { lead, attribution };
}
