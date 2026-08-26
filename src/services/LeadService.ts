/**
 * LeadService — consumer lead intake and attribution.
 *
 * A Lead here is a CONSUMER acquired for a client. Attribution priority is unchanged
 * from Sprint 0: explicit `ref` param > `rx_ref` cookie > none.
 *
 * New leads are created with status=new. Money is not touched at capture: commission is
 * created by CommissionService at approval, from a record rather than a field.
 *
 * Storage- and framework-agnostic.
 */
import type { AttributionSource, Lead, LeadAttribution } from '@/src/domain/types';
import {
  consumerDedupKey,
  normalizePhoneUS,
  resolveLeadDedupWindowMinutes,
} from '@/src/domain/value-objects';
import type { CampaignRepo, LeadRepo, OfferRepo } from '@/src/repositories/interfaces';
import type { AttributionService } from '@/src/services/AttributionService';
import type { AdminNotifier } from '@/src/services/notifications';

export interface LeadServiceDeps {
  leads: LeadRepo;
  offers: OfferRepo;
  campaigns: CampaignRepo;
  attribution: AttributionService;
  notifier: AdminNotifier;
}

export interface CaptureLeadInput {
  /** Ref from the request param (`?ref=` / body) — highest attribution priority. */
  ref?: string;
  /** Ref from the `rx_ref` cookie — used only if the param ref is absent/invalid. */
  cookieRef?: string;
  /** Offer code hint to associate an offer when no ref attributes a publisher. */
  offerHint?: string;
  /** Raw form fields (stored verbatim as capturedData). */
  fields: Record<string, unknown>;
}

export interface CaptureLeadResult {
  lead: Lead;
  attribution: LeadAttribution | null;
  /**
   * Set when this submission matched an earlier lead inside the configured de-duplication
   * window. The lead is still recorded — the client wants to know — but no attribution is
   * written, so no commission can arise from it.
   */
  duplicateOfLeadId?: string;
}

export class LeadService {
  constructor(private readonly deps: LeadServiceDeps) {}

  async create(input: CaptureLeadInput): Promise<CaptureLeadResult> {
    const resolved = await this.attribute(input);
    const fields = input.fields ?? {};

    const customerEmail = pickEmail(fields);
    const customerPhone = pickPhone(fields);
    const dedupKey = resolved.offerId
      ? (consumerDedupKey(resolved.offerId, customerEmail, customerPhone) ?? undefined)
      : undefined;

    const duplicateOf = dedupKey
      ? await this.findDuplicate(dedupKey, resolved.offerId, resolved.campaignId)
      : null;

    const lead = await this.deps.leads.append({
      publisherId: duplicateOf ? null : resolved.publisherId,
      offerId: resolved.offerId,
      clientId: resolved.clientId,
      productId: resolved.productId,
      campaignId: resolved.campaignId,
      refCode: duplicateOf ? null : resolved.refCode,
      status: 'new',
      capturedData: fields,
      customerName: pickString(fields, 'name'),
      customerPhone,
      customerEmail,
      dedupKey,
      createdAt: new Date().toISOString(),
    });

    // A duplicate is deliberately left unattributed: recording it loses nothing, and not
    // attributing it is what stops the same consumer being paid for twice.
    let attribution: LeadAttribution | null = null;
    if (!duplicateOf && resolved.publisherId && resolved.offerId && resolved.clientId) {
      attribution = await this.deps.attribution.attribute({
        leadId: lead.id,
        publisherId: resolved.publisherId,
        offerId: resolved.offerId,
        clientId: resolved.clientId,
        source: resolved.source as AttributionSource,
      });
    }

    // Notify admin; never let a notification failure fail the capture.
    void this.deps.notifier.notifyNewLead(lead).catch(() => undefined);

    return {
      lead,
      attribution,
      duplicateOfLeadId: duplicateOf?.id,
    };
  }

  /**
   * Look for the same consumer on the same offer inside the configured window.
   *
   * Returns null when no window is configured — see `resolveLeadDedupWindowMinutes`. No
   * default window is invented here, because how long two submissions count as one is a
   * commercial term that differs per campaign.
   */
  private async findDuplicate(
    dedupKey: string,
    offerId: string | null,
    campaignId: string | null,
  ): Promise<Lead | null> {
    if (!offerId) return null;
    const offer = await this.deps.offers.getById(offerId);
    const campaign = campaignId ? await this.deps.campaigns.getById(campaignId) : null;
    const windowMinutes = resolveLeadDedupWindowMinutes(
      offer?.leadDedupWindowMinutes,
      campaign?.leadDedupWindowMinutes,
    );
    if (windowMinutes === null) return null;
    return this.deps.leads.findRecentByDedupKey(dedupKey, windowMinutes * 60_000);
  }

  /** Resolve attribution by priority: param ref > cookie ref > offerHint (offer only) > none. */
  private async attribute(input: CaptureLeadInput): Promise<{
    publisherId: string | null;
    offerId: string | null;
    clientId: string | null;
    productId: string | null;
    campaignId: string | null;
    refCode: string | null;
    source: AttributionSource | null;
  }> {
    for (const [ref, source] of [
      [input.ref, 'param'] as const,
      [input.cookieRef, 'cookie'] as const,
    ]) {
      if (!ref) continue;
      const r = await this.deps.attribution.resolve(ref);
      if (!r.ok) continue;
      const campaign = await this.deps.campaigns.getById(r.offer.campaignId);
      return {
        publisherId: r.publisher.id,
        offerId: r.offer.id,
        clientId: r.offer.clientId,
        productId: campaign?.productId ?? null,
        campaignId: r.offer.campaignId,
        refCode: r.refCode,
        source,
      };
    }

    // No publisher attribution — still record which offer the lead targeted, if we can tell.
    if (input.offerHint) {
      const offer = await this.deps.offers.getByCode(input.offerHint);
      if (offer) {
        const campaign = await this.deps.campaigns.getById(offer.campaignId);
        return {
          publisherId: null,
          offerId: offer.id,
          clientId: offer.clientId,
          productId: campaign?.productId ?? null,
          campaignId: offer.campaignId,
          refCode: null,
          source: null,
        };
      }
    }

    return {
      publisherId: null,
      offerId: null,
      clientId: null,
      productId: null,
      campaignId: null,
      refCode: null,
      source: null,
    };
  }
}

function pickString(fields: Record<string, unknown>, key: string): string | undefined {
  const v = fields[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function pickPhone(fields: Record<string, unknown>): string | undefined {
  const raw = pickString(fields, 'phone');
  return raw ? normalizePhoneUS(raw) : undefined;
}

function pickEmail(fields: Record<string, unknown>): string | undefined {
  const raw = pickString(fields, 'email');
  return raw ? raw.toLowerCase() : undefined;
}
