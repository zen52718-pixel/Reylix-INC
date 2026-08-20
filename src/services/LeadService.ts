/**
 * LeadService (Blueprint Sprint 3) — public lead intake + cross-domain attribution.
 *
 * Attribution priority: explicit `ref` param > `rx_ref` cookie > none (Blueprint §4.1).
 * New leads are created with status=new and commission=0 (commission is locked later at
 * approval, Sprint 5). The raw form fields are stored as `capturedData`, with name/phone
 * denormalized onto the row for admin readability. Storage- and framework-agnostic.
 */
import type { AttributionSource, Lead } from '@/src/domain/types';
import { normalizePhoneUS } from '@/src/domain/value-objects';
import type { LeadRepo, OfferRepo } from '@/src/repositories/interfaces';
import type { AttributionService } from '@/src/services/AttributionService';
import type { AdminNotifier } from '@/src/services/notifications';

export interface LeadServiceDeps {
  leads: LeadRepo;
  offers: OfferRepo;
  attribution: AttributionService;
  notifier: AdminNotifier;
}

export interface CaptureLeadInput {
  /** Ref from the request param (`?ref=` / body) — highest attribution priority. */
  ref?: string;
  /** Ref from the `rx_ref` cookie — used only if the param ref is absent/invalid. */
  cookieRef?: string;
  /** Offer code hint (e.g. "MVA1") to associate an offer when no ref attributes a publisher. */
  offerHint?: string;
  /** Raw form fields (stored verbatim as captured_data). */
  fields: Record<string, unknown>;
}

export class LeadService {
  constructor(private readonly deps: LeadServiceDeps) {}

  async create(input: CaptureLeadInput): Promise<Lead> {
    const attribution = await this.attribute(input);

    const fields = input.fields ?? {};
    const lead = await this.deps.leads.append({
      publisherId: attribution.publisherId,
      offerId: attribution.offerId,
      buyerId: attribution.buyerId,
      refCode: attribution.refCode,
      attributionSource: attribution.source,
      status: 'new',
      commissionAmount: 0,
      capturedData: fields,
      customerName: pickString(fields, 'name'),
      customerPhone: pickPhone(fields),
      createdAt: new Date().toISOString(),
    });

    // Notify admin; never let a notification failure fail the capture.
    void this.deps.notifier.notifyNewLead(lead).catch(() => undefined);

    return lead;
  }

  /** Resolve attribution by priority: param ref > cookie ref > offerHint (offer only) > none. */
  private async attribute(input: CaptureLeadInput): Promise<{
    publisherId: string | null;
    offerId: string | null;
    buyerId: string | null;
    refCode: string | null;
    source: AttributionSource;
  }> {
    if (input.ref) {
      const r = await this.deps.attribution.resolve(input.ref);
      if (r.ok)
        return {
          publisherId: r.publisher.id,
          offerId: r.offer.id,
          buyerId: r.offer.buyerId,
          refCode: r.refCode,
          source: 'param',
        };
    }
    if (input.cookieRef) {
      const r = await this.deps.attribution.resolve(input.cookieRef);
      if (r.ok)
        return {
          publisherId: r.publisher.id,
          offerId: r.offer.id,
          buyerId: r.offer.buyerId,
          refCode: r.refCode,
          source: 'cookie',
        };
    }
    // No publisher attribution — still record which offer the lead targeted, if we can tell.
    let offerId: string | null = null;
    let buyerId: string | null = null;
    if (input.offerHint) {
      const offer = await this.deps.offers.getByCode(input.offerHint);
      if (offer) {
        offerId = offer.id;
        buyerId = offer.buyerId;
      }
    }
    return { publisherId: null, offerId, buyerId, refCode: null, source: 'none' };
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
