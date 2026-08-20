/**
 * AttributionService (Blueprint Sprint 2) — the core of the attribution loop.
 *
 * Pure business logic: resolve a referral code to its publisher/offer, compute click
 * dedup + uniqueness, build the (allowlisted) redirect destination, and append the click.
 * Storage-agnostic and framework-agnostic — it knows nothing about HTTP requests; the
 * `/r/[ref]` route adapts the request to these calls. Depends only on repo interfaces.
 */
import { createHash } from 'node:crypto';
import type { Offer, Publisher } from '@/src/domain/types';
import { formatRefCode, parseRefCode, type RefCodeParts } from '@/src/domain/value-objects';
import type { ClickRepo, OfferRepo, PublisherRepo } from '@/src/repositories/interfaces';

export interface AttributionDeps {
  publishers: PublisherRepo;
  offers: OfferRepo;
  clicks: ClickRepo;
}

export interface AttributionConfig {
  /** Dedup window in minutes (env CLICK_DEDUP_MINUTES). */
  dedupMinutes: number;
  /** Hosts permitted as redirect targets for the optional `?to=` override (env ALLOWED_REDIRECT_HOSTS). */
  allowedRedirectHosts: string[];
}

/** Why a ref failed to resolve — surfaced for anomaly logging (never shown to users). */
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

    return { ok: true, refCode: formatRefCode(publisher.publisherCode, offer.offerCode), publisher, offer };
  }

  /**
   * Dedup key for a click. The Blueprint describes hash(ip + ua); we scope it to the
   * referral link as well so clicks on *different* links from the same visitor are not
   * collapsed into one another (per-link uniqueness, not per-visitor).
   */
  computeDedupKey(refCode: string, ip: string, userAgent: string): string {
    return createHash('sha256').update(`${refCode}|${ip}|${userAgent}`).digest('hex');
  }

  /** Append a click, computing `is_unique` against the dedup window. Idempotent-ish: a
   *  repeat within the window is still recorded but flagged `is_unique=false`. */
  async recordClick(resolved: ResolvedRef, ctx: ClickContext): Promise<void> {
    const dedupKey = this.computeDedupKey(resolved.refCode, ctx.ip, ctx.userAgent);
    const seen = await this.deps.clicks.recentDedup(dedupKey, this.config.dedupMinutes * 60_000);
    await this.deps.clicks.append({
      refCode: resolved.refCode,
      publisherId: resolved.publisher.id,
      offerId: resolved.offer.id,
      clickedAt: new Date().toISOString(),
      country: ctx.country,
      deviceType: ctx.deviceType,
      userAgent: ctx.userAgent || undefined,
      dedupKey,
      isUnique: !seen,
    });
  }

  /**
   * Build the final redirect URL with `?ref=` appended. Uses the offer's (admin-trusted)
   * destination unless a valid, allowlisted `?to=` override is supplied. Returns whether a
   * provided `to` was rejected so the route can log an anomaly.
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
    // Last-resort fallback for a non-absolute destination (should not happen — offers are
    // validated as http(s) URLs on create).
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}ref=${encodeURIComponent(refCode)}`;
  }
}
