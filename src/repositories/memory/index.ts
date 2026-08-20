/**
 * In-memory adapter. Lets the app and tests run with zero configuration. Each call
 * returns a fresh, isolated set of stores — ideal for test isolation. The
 * application-wide singleton is managed by the top-level factory (`../index.ts`).
 */
import type { RepositoryBundle } from '@/src/repositories/interfaces';
import { MemoryAuditRepo } from '@/src/repositories/memory/MemoryAuditRepo';
import { MemoryBuyerRepo } from '@/src/repositories/memory/MemoryBuyerRepo';
import { MemoryClickRepo } from '@/src/repositories/memory/MemoryClickRepo';
import { MemoryContactRepo } from '@/src/repositories/memory/MemoryContactRepo';
import { MemoryLeadRepo } from '@/src/repositories/memory/MemoryLeadRepo';
import { MemoryOfferRepo } from '@/src/repositories/memory/MemoryOfferRepo';
import { MemoryPayoutRepo } from '@/src/repositories/memory/MemoryPayoutRepo';
import { MemoryPublisherRepo } from '@/src/repositories/memory/MemoryPublisherRepo';
import { MemoryReferralLinkRepo } from '@/src/repositories/memory/MemoryReferralLinkRepo';

export function createMemoryRepositories(): RepositoryBundle {
  return {
    buyers: new MemoryBuyerRepo(),
    publishers: new MemoryPublisherRepo(),
    offers: new MemoryOfferRepo(),
    referralLinks: new MemoryReferralLinkRepo(),
    clicks: new MemoryClickRepo(),
    leads: new MemoryLeadRepo(),
    payouts: new MemoryPayoutRepo(),
    audit: new MemoryAuditRepo(),
    contacts: new MemoryContactRepo(),
  };
}
