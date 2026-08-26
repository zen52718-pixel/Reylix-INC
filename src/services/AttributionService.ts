/**
 * AttributionService — the core of the attribution loop.
 *
 * Pure business logic: resolve a referral code to its publisher/offer, compute click
 * dedup, build the (allowlisted) redirect destination, append the click, and write the
 * LeadAttribution row that decides who is credited.
 *
 * Attribution is APPEND-ONLY. Re-attributing a lead supersedes the previous row rather
 * than editing it, so a commission dispute can be answered with evidence of what was
 * decided and when — which a single overwritable field cannot provide.
 *
 * Storage- and framework-agnostic; depends only on repository interfaces.
 */
import { createHash } from 'node:crypto';
import { ConflictError, NotFoundError, ValidationError } from '@/src/domain/errors';
import type { AttributionSource, Click, LeadAttribution, Offer, Publisher } from '@/src/domain/types';
import { formatRefCode, parseRefCode, type RefCodeParts } from '@/src/domain/value-objects';
import type {
  ClickRepo,
  LeadAttributionRepo,
  LeadRepo,
  OfferRepo,
  PublisherRepo,
} from '@/src/repositories/interfaces';

export interface AttributionDeps {
  publishers: PublisherRepo;
  offers: OfferRepo;
  clicks: ClickRepo;
  leadAttributions: LeadAttributionRepo;
  leads: LeadRepo;
}

export interface AttributionConfig {
  /** Click dedup window in minutes (env CLICK_DEDUP_MINUTES). Technical, not commercial. */
  dedupMinutes: number;
  /** Hosts permitted as redirect targets for the optional `?to=` override. */
  allowedRedirectHosts: string[];
}

/** Why a ref failed to resolve — surfaced for anomaly logging, never shown to users. */
export type ResolveFailureReason =
  | 'malformed_ref'
  | 'unknown_publisher'
  | 'publisher_suspended'
  | 'unknown_offer'
  | 'offer_inactive';

export interface ResolvedRef {
  refCode: string;
  publisher: Publisher;
  offer: Offer;
}

export type ResolveResult = ({ ok: true } & ResolvedRef) | { ok: false; reason: ResolveFailureReason };

export interface ClickContext {
  ip: string;
  userAgent: string;
  country?: string;
  deviceType?: string;
}

export class AttributionService {
  constructor(
    private readonly deps: AttributionDeps,
    private readonly config: AttributionConfig,
  ) {}

  /** Parse a raw ref into its parts, or null if malformed. */
  parseRef(ref: string): RefCodeParts | null {
    return parseRefCode(ref);
  }

  /** Resolve a ref to an active publisher + active offer. */
  async resolve(ref: string): Promise<ResolveResult> {
    const parts = this.parseRef(ref);
    if (!parts) return { ok: false, reason: 'malformed_ref' };

    const publisher = await this.deps.publishers.getByCode(parts.publisherCode);
    if (!publisher) return { ok: false, reason: 'unknown_publisher' };
    if (publisher.status === 'suspended') return { ok: false, reason: 'publisher_suspended' };

    const offer = await this.deps.offers.getByCode(parts.offerCode);
    if (!offer) return { ok: false, reason: 'unknown_offer' };
    if (!offer.isActive) return { ok: false, reason: 'offer_inactive' };

    return {
      ok: true,
      refCode: formatRefCode(publisher.publisherCode, offer.offerCode),
      publisher,
      offer,
    };
  }

  /**
   * Dedup key for a click, scoped to the referral link as well as the visitor, so clicks
   * on different links from the same person are not collapsed into one another.
   */
  computeDedupKey(refCode: string, ip: string, userAgent: string): string {
    return createHash('sha256').update(`${refCode}|${ip}|${userAgent}`).digest('hex');
  }

  /** Append a click, computing `isUnique` against the dedup window. Returns the stored row. */
  async recordClick(
    resolved: ResolvedRef,
    ctx: ClickContext,
    referralLinkId?: string,
  ): Promise<Click> {
    const dedupKey = this.computeDedupKey(resolved.refCode, ctx.ip, ctx.userAgent);
    const seen = await this.deps.clicks.recentDedup(dedupKey, this.config.dedupMinutes * 60_000);
    return this.deps.clicks.append({
      refCode: resolved.refCode,
      publisherId: resolved.publisher.id,
      offerId: resolved.offer.id,
      referralLinkId,
      clickedAt: new Date().toISOString(),
      country: ctx.country,
      deviceType: ctx.deviceType,
      userAgent: ctx.userAgent || undefined,
      dedupKey,
      isUnique: !seen,
    });
  }

  /**
   * Write the attribution row for a lead. Fails if the lead already has a live
   * attribution — credit is granted once, and changing it is an explicit re-attribution.
   */
  async attribute(input: {
    leadId: string;
    publisherId: string;
    offerId: string;
    clientId: string;
    source: AttributionSource;
    referralLinkId?: string;
    clickId?: string;
    attributedBy?: string;
    reason?: string;
  }): Promise<LeadAttribution> {
    if (input.source === 'manual' && !input.attributedBy) {
      throw new ValidationError('attributedBy is required for manual attribution', {
        leadId: input.leadId,
      });
    }
    return this.deps.leadAttributions.append({
      leadId: input.leadId,
      publisherId: input.publisherId,
      offerId: input.offerId,
      clientId: input.clientId,
      referralLinkId: input.referralLinkId,
      clickId: input.clickId,
      source: input.source,
      attributedAt: new Date().toISOString(),
      attributedBy: input.attributedBy,
      reason: input.reason,
    });
  }

  /** The publisher currently credited for a lead, if any. */
  async currentAttribution(leadId: string): Promise<LeadAttribution | null> {
    return this.deps.leadAttributions.getCurrentForLead(leadId);
  }

  async attributionHistory(leadId: string): Promise<LeadAttribution[]> {
    return this.deps.leadAttributions.listByLead(leadId);
  }

  /**
   * Move credit for a lead to a different publisher. The existing row is superseded, not
   * edited, and the lead's denormalized publisherId is refreshed to match.
   */
  async reattribute(
    leadId: string,
    publisherId: string,
    actor: string,
    reason: string,
  ): Promise<LeadAttribution> {
    const trimmed = (reason ?? '').trim();
    if (!trimmed) {
      throw new ValidationError('A reason is required to re-attribute a lead', { leadId });
    }
    const lead = await this.deps.leads.getById(leadId);
    if (!lead) throw new NotFoundError(`Lead ${leadId} not found`);
    if (!lead.offerId || !lead.clientId) {
      throw new ConflictError('Lead has no offer; it cannot be attributed', { leadId });
    }
    const publisher = await this.deps.publishers.getById(publisherId);
    if (!publisher) throw new NotFoundError(`Publisher ${publisherId} not found`);

    const current = await this.deps.leadAttributions.getCurrentForLead(leadId);
    if (current) {
      await this.deps.leadAttributions.supersede(current.id, new Date().toISOString(), trimmed);
    }

    const created = await this.attribute({
      leadId,
      publisherId,
      offerId: lead.offerId,
      clientId: lead.clientId,
      source: 'manual',
      attributedBy: actor,
      reason: trimmed,
    });
    await this.deps.leads.update(leadId, { publisherId });
    return created;
  }

  /**
   * Build the final redirect URL with `?ref=` appended. Uses the offer's (admin-trusted)
   * destination unless a valid, allowlisted `?to=` override is supplied.
   */
  buildDestinationUrl(
    offer: Offer,
    refCode: string,
    to?: string,
  ): { url: string; toRejected: boolean } {
    const toAllowed = to ? this.isAllowedRedirect(to) : false;
    const toRejected = Boolean(to) && !toAllowed;
    const base = toAllowed && to ? to : offer.destinationUrl;
    return { url: appendRefParam(base, refCode), toRejected };
  }

  /** True if the URL's host is in the allowlist (exact host or a subdomain of one). */
  isAllowedRedirect(rawUrl: string): boolean {
    let host: string;
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      host = url.hostname.toLowerCase();
    } catch {
      return false;
    }
    return this.config.allowedRedirectHosts.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  }
}

/** Append/overwrite the `ref` query param, preserving any existing query string. */
function appendRefParam(rawUrl: string, refCode: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set('ref', refCode);
    return url.toString();
  } catch {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}ref=${encodeURIComponent(refCode)}`;
  }
}
