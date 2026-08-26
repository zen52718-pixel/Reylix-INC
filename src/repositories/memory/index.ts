/**
 * In-memory adapter. Lets the app and tests run with zero configuration. Each call
 * returns a fresh, isolated set of stores — ideal for test isolation. The
 * application-wide singleton is managed by the top-level factory (`../index.ts`).
 */
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { MemoryAuditRepo } from '@/src/repositories/memory/MemoryAuditRepo';
import { MemoryCampaignRepo } from '@/src/repositories/memory/MemoryCampaignRepo';
import { MemoryClickRepo } from '@/src/repositories/memory/MemoryClickRepo';
import { MemoryClientRepo } from '@/src/repositories/memory/MemoryClientRepo';
import { MemoryCommissionRepo } from '@/src/repositories/memory/MemoryCommissionRepo';
import { MemoryInquiryRepo } from '@/src/repositories/memory/MemoryInquiryRepo';
import { MemoryLeadAttributionRepo } from '@/src/repositories/memory/MemoryLeadAttributionRepo';
import { MemoryLeadRepo } from '@/src/repositories/memory/MemoryLeadRepo';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { MemoryPayoutRepo } from '@/src/repositories/memory/MemoryPayoutRepo';
import { MemoryProductRepo } from '@/src/repositories/memory/MemoryProductRepo';
import { MemoryPublisherRepo } from '@/src/repositories/memory/MemoryPublisherRepo';
import { MemoryReferralLinkRepo } from '@/src/repositories/memory/MemoryReferralLinkRepo';

export function createMemoryRepositories(): RepositoryBundle {
  return {
    clients: new MemoryClientRepo(),
    products: new MemoryProductRepo(),
    campaigns: new MemoryCampaignRepo(),
    publishers: new MemoryPublisherRepo(),
    offers: new MemoryOfferRepo(),
    referralLinks: new MemoryReferralLinkRepo(),
    clicks: new MemoryClickRepo(),
    leads: new MemoryLeadRepo(),
    leadAttributions: new MemoryLeadAttributionRepo(),
    commissions: new MemoryCommissionRepo(),
    payouts: new MemoryPayoutRepo(),
    audit: new MemoryAuditRepo(),
    inquiries: new MemoryInquiryRepo(),
  };
}
