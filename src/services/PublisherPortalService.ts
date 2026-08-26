/**
 * PublisherPortalService — every read and write is scoped to a single publisherId that
 * the caller derives from the verified session.
 *
 * This service IS the server-side publisher scoping. The repository layer runs on the
 * service-role key and therefore BYPASSES RLS, so a missing scope here is not caught by
 * the database. That is why publisherId is a required argument on every method and is
 * never taken from caller-supplied input.
 *
 * Storage-agnostic (depends only on repository interfaces).
 */
import { NotFoundError } from '@/src/domain/errors';
import type { Lead, LeadStatus, Offer, Publisher } from '@/src/domain/types';
import { formatRefCode } from '@/src/domain/value-objects';
import type {
  ClickRepo,
  CommissionRepo,
  DateRange,
  LeadRepo,
  OfferRepo,
  PublisherRepo,
  ReferralLinkRepo,
} from '@/src/repositories/interfaces';

export interface PublisherPortalDeps {
  publishers: PublisherRepo;
  offers: OfferRepo;
  leads: LeadRepo;
  clicks: ClickRepo;
  referralLinks: ReferralLinkRepo;
  commissions: CommissionRepo;
}

export interface PublisherPortalConfig {
  /** Base URL for building referral links, e.g. https://go.reylix.com */
  redirectBaseUrl: string;
}

export interface PublisherSummary {
  clicks: number;
  leads: number;
  approved: number;
  commissionEarned: number;
  paid: number;
  unpaid: number;
}

export interface OfferWithLink {
  offer: Offer;
  refCode: string;
  link: string;
}

export interface ReferralLinkView {
  offerName: string;
  refCode: string;
  link: string;
}

const ACCOUNT_FIELDS = [
  'fullName',
  'phone',
  'country',
  'city',
  'audienceType',
  'promoDescription',
  'payoutMethod',
  'payoutDetails',
] as const;

export type AccountUpdate = Partial<Pick<Publisher, (typeof ACCOUNT_FIELDS)[number]>>;

export class PublisherPortalService {
  constructor(
    private readonly deps: PublisherPortalDeps,
    private readonly config: PublisherPortalConfig,
  ) {}

  async getProfile(publisherId: string): Promise<Publisher> {
    return this.requirePublisher(publisherId);
  }

  /**
   * Headline metrics. Earnings come from COMMISSION records rather than from the lead
   * row, so what a publisher sees is the same money the payout run will pay.
   */
  async summary(publisherId: string, range?: DateRange): Promise<PublisherSummary> {
    await this.requirePublisher(publisherId);
    const [clickList, leadList, commissionList] = await Promise.all([
      this.deps.clicks.listByPublisher(publisherId, range),
      this.deps.leads.list({ publisherId, from: range?.from, to: range?.to }),
      this.deps.commissions.list({ publisherId }),
    ]);

    const approvedOrPaid = leadList.filter((l) => l.status === 'approved' || l.status === 'paid');
    // Voided and clawed-back commissions are excluded: they are not earnings.
    const live = commissionList.filter(
      (c) => c.status === 'payable' || c.status === 'processing' || c.status === 'paid',
    );
    const commissionEarned = sum(live.map((c) => c.amount));
    const paid = sum(live.filter((c) => c.status === 'paid').map((c) => c.amount));

    return {
      clicks: clickList.length,
      leads: leadList.length,
      approved: approvedOrPaid.length,
      commissionEarned,
      paid,
      unpaid: commissionEarned - paid,
    };
  }

  /** Active offers, each with this publisher's deterministic ref code + link. */
  async offersWithLinks(publisherId: string): Promise<OfferWithLink[]> {
    const publisher = await this.requirePublisher(publisherId);
    const offers = await this.deps.offers.listActive();
    const result: OfferWithLink[] = [];
    for (const offer of offers) {
      const refCode = formatRefCode(publisher.publisherCode, offer.offerCode);
      const existing = await this.deps.referralLinks.getByPublisherAndOffer(publisherId, offer.id);
      if (!existing) {
        await this.deps.referralLinks.create({ publisherId, offerId: offer.id, refCode });
      }
      result.push({ offer, refCode, link: this.linkFor(refCode) });
    }
    return result;
  }

  /** Persisted referral links for this publisher, joined to offer names. */
  async links(publisherId: string): Promise<ReferralLinkView[]> {
    await this.requirePublisher(publisherId);
    const rows = await this.deps.referralLinks.listByPublisher(publisherId);
    const views: ReferralLinkView[] = [];
    for (const row of rows) {
      const offer = await this.deps.offers.getById(row.offerId);
      views.push({
        offerName: offer?.name ?? row.offerId,
        refCode: row.refCode,
        link: this.linkFor(row.refCode),
      });
    }
    return views;
  }

  /** This publisher's leads. publisherId is forced — any caller-supplied value is ignored. */
  async leads(
    publisherId: string,
    filter?: { status?: LeadStatus; from?: string; to?: string },
  ): Promise<Lead[]> {
    await this.requirePublisher(publisherId);
    return this.deps.leads.list({
      publisherId,
      status: filter?.status,
      from: filter?.from,
      to: filter?.to,
    });
  }

  /** Summary + the underlying leads, for the reports view / CSV export. */
  async report(
    publisherId: string,
    range?: DateRange,
  ): Promise<{ summary: PublisherSummary; leads: Lead[] }> {
    const [summary, leads] = await Promise.all([
      this.summary(publisherId, range),
      this.leads(publisherId, { from: range?.from, to: range?.to }),
    ]);
    return { summary, leads };
  }

  /** Update profile/payout fields only — never code, email, status, or attribution data. */
  async updateAccount(publisherId: string, input: AccountUpdate): Promise<Publisher> {
    await this.requirePublisher(publisherId);
    const patch: AccountUpdate = {};
    for (const field of ACCOUNT_FIELDS) {
      // Per-key assignment across a union of field types needs a widening cast; the
      // ACCOUNT_FIELDS allowlist is what actually keeps this safe.
      if (input[field] !== undefined) (patch as Record<string, unknown>)[field] = input[field];
    }
    return this.deps.publishers.update(publisherId, patch);
  }

  private linkFor(refCode: string): string {
    return `${this.config.redirectBaseUrl}/r/${refCode}`;
  }

  private async requirePublisher(publisherId: string): Promise<Publisher> {
    const publisher = await this.deps.publishers.getById(publisherId);
    if (!publisher) throw new NotFoundError(`Publisher ${publisherId} not found`);
    return publisher;
  }
}

function sum(values: number[]): number {
  return values.reduce((acc, n) => acc + n, 0);
}
