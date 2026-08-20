import { randomUUID } from 'node:crypto';
import type { ReferralLink } from '@/src/domain/types';
import type { ReferralLinkRepo } from '@/src/repositories/interfaces';

export class MemoryReferralLinkRepo implements ReferralLinkRepo {
  private readonly store = new Map<string, ReferralLink>();

  async getByCode(refCode: string): Promise<ReferralLink | null> {
    const target = refCode.trim().toUpperCase();
    for (const r of this.store.values()) {
      if (r.refCode.toUpperCase() === target) return r;
    }
    return null;
  }

  async getByPublisherAndOffer(publisherId: string, offerId: string): Promise<ReferralLink | null> {
    for (const r of this.store.values()) {
      if (r.publisherId === publisherId && r.offerId === offerId) return r;
    }
    return null;
  }

  async listByPublisher(publisherId: string): Promise<ReferralLink[]> {
    return [...this.store.values()].filter((r) => r.publisherId === publisherId);
  }

  async create(r: Omit<ReferralLink, 'id' | 'createdAt'>): Promise<ReferralLink> {
    const link: ReferralLink = { ...r, id: randomUUID(), createdAt: new Date().toISOString() };
    this.store.set(link.id, link);
    return link;
  }
}
