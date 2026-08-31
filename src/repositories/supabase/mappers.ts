/**
 * Row <-> domain mapping. The database speaks snake_case and timestamptz; the domain
 * speaks camelCase and ISO-8601 strings. This module is the ONLY place that translation
 * lives, so a column rename never reaches past the adapter.
 */
import type {
  AuditEntry,
  Campaign,
  Click,
  Client,
  Commission,
  Inquiry,
  Lead,
  LeadAttribution,
  Offer,
  PayoutRow,
  Product,
  Publisher,
  ReferralLink,
} from '@/src/domain/types';

export type Row = Record<string, unknown>;

const iso = (v: unknown): string => (v ? new Date(v as string).toISOString() : '');
const isoOpt = (v: unknown): string | undefined =>
  v ? new Date(v as string).toISOString() : undefined;
const str = (v: unknown): string => (v == null ? '' : String(v));
const strOpt = (v: unknown): string | undefined => (v == null || v === '' ? undefined : String(v));
const num = (v: unknown): number => (v == null ? 0 : Number(v));
const numOpt = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

/** Drop undefined values so a partial patch never nulls a column it did not mention. */
export function compact(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

// ── clients ──────────────────────────────────────────────────────────────────
export const clientFromRow = (r: Row): Client => ({
  id: str(r.id),
  company: str(r.company),
  contactName: str(r.contact_name),
  contactEmail: str(r.contact_email),
  contactPhone: strOpt(r.contact_phone),
  status: r.status as Client['status'],
  notes: strOpt(r.notes),
  createdAt: iso(r.created_at),
});

export const clientToRow = (c: Partial<Client>): Row =>
  compact({
    id: c.id,
    company: c.company,
    contact_name: c.contactName,
    contact_email: c.contactEmail,
    contact_phone: c.contactPhone,
    status: c.status,
    notes: c.notes,
    created_at: c.createdAt,
  });

// ── products ─────────────────────────────────────────────────────────────────
export const productFromRow = (r: Row): Product => ({
  id: str(r.id),
  slug: str(r.slug),
  name: str(r.name),
  description: strOpt(r.description),
  status: r.status as Product['status'],
  createdAt: iso(r.created_at),
});

export const productToRow = (p: Partial<Product>): Row =>
  compact({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    status: p.status,
    created_at: p.createdAt,
  });

// ── campaigns ────────────────────────────────────────────────────────────────
export const campaignFromRow = (r: Row): Campaign => ({
  id: str(r.id),
  productId: str(r.product_id),
  slug: str(r.slug),
  name: str(r.name),
  market: strOpt(r.market),
  leadDedupWindowMinutes: numOpt(r.lead_dedup_window_minutes),
  isActive: Boolean(r.is_active),
  createdAt: iso(r.created_at),
});

export const campaignToRow = (c: Partial<Campaign>): Row =>
  compact({
    id: c.id,
    product_id: c.productId,
    slug: c.slug,
    name: c.name,
    market: c.market,
    lead_dedup_window_minutes: c.leadDedupWindowMinutes,
    is_active: c.isActive,
    created_at: c.createdAt,
  });

// ── publishers ───────────────────────────────────────────────────────────────
export const publisherFromRow = (r: Row): Publisher => ({
  id: str(r.id),
  publisherCode: str(r.publisher_code),
  fullName: str(r.full_name),
  email: str(r.email),
  phone: str(r.phone),
  country: strOpt(r.country),
  city: strOpt(r.city),
  audienceType: strOpt(r.audience_type),
  promoDescription: strOpt(r.promo_description),
  payoutMethod: r.payout_method as Publisher['payoutMethod'],
  payoutDetails: strOpt(r.payout_details),
  status: r.status as Publisher['status'],
  authUserId: strOpt(r.auth_user_id),
  createdAt: iso(r.created_at),
  approvedAt: isoOpt(r.approved_at),
});

export const publisherToRow = (p: Partial<Publisher>): Row =>
  compact({
    id: p.id,
    publisher_code: p.publisherCode,
    full_name: p.fullName,
    email: p.email,
    phone: p.phone,
    country: p.country,
    city: p.city,
    audience_type: p.audienceType,
    promo_description: p.promoDescription,
    payout_method: p.payoutMethod,
    payout_details: p.payoutDetails,
    status: p.status,
    auth_user_id: p.authUserId,
    created_at: p.createdAt,
    approved_at: p.approvedAt,
  });

// ── offers ───────────────────────────────────────────────────────────────────
export const offerFromRow = (r: Row): Offer => ({
  id: str(r.id),
  productId: strOpt(r.product_id),
  campaignId: strOpt(r.campaign_id),
  clientId: str(r.client_id),
  offerCode: str(r.offer_code),
  name: str(r.name),
  description: strOpt(r.description),
  destinationUrl: str(r.destination_url),
  commissionModel: r.commission_model as Offer['commissionModel'],
  commissionAmount: num(r.commission_amount),
  currency: str(r.currency),
  leadDedupWindowMinutes: numOpt(r.lead_dedup_window_minutes),
  isActive: Boolean(r.is_active),
  createdAt: iso(r.created_at),
});

export const offerToRow = (o: Partial<Offer>): Row =>
  compact({
    id: o.id,
    product_id: o.productId,
    campaign_id: o.campaignId,
    client_id: o.clientId,
    offer_code: o.offerCode,
    name: o.name,
    description: o.description,
    destination_url: o.destinationUrl,
    commission_model: o.commissionModel,
    commission_amount: o.commissionAmount,
    currency: o.currency,
    lead_dedup_window_minutes: o.leadDedupWindowMinutes,
    is_active: o.isActive,
    created_at: o.createdAt,
  });

// ── referral links ───────────────────────────────────────────────────────────
export const referralLinkFromRow = (r: Row): ReferralLink => ({
  id: str(r.id),
  publisherId: str(r.publisher_id),
  offerId: str(r.offer_id),
  refCode: str(r.ref_code),
  createdAt: iso(r.created_at),
});

export const referralLinkToRow = (l: Partial<ReferralLink>): Row =>
  compact({
    id: l.id,
    publisher_id: l.publisherId,
    offer_id: l.offerId,
    ref_code: l.refCode,
    created_at: l.createdAt,
  });

// ── clicks ───────────────────────────────────────────────────────────────────
export const clickFromRow = (r: Row): Click => ({
  id: str(r.id),
  refCode: str(r.ref_code),
  publisherId: str(r.publisher_id),
  offerId: str(r.offer_id),
  referralLinkId: strOpt(r.referral_link_id),
  clickedAt: iso(r.clicked_at),
  country: strOpt(r.country),
  deviceType: strOpt(r.device_type),
  userAgent: strOpt(r.user_agent),
  dedupKey: str(r.dedup_key),
  isUnique: Boolean(r.is_unique),
});

export const clickToRow = (c: Partial<Click>): Row =>
  compact({
    id: c.id,
    ref_code: c.refCode,
    publisher_id: c.publisherId,
    offer_id: c.offerId,
    referral_link_id: c.referralLinkId,
    clicked_at: c.clickedAt,
    country: c.country,
    device_type: c.deviceType,
    user_agent: c.userAgent,
    dedup_key: c.dedupKey,
    is_unique: c.isUnique,
  });

// ── leads ────────────────────────────────────────────────────────────────────
export const leadFromRow = (r: Row): Lead => ({
  id: str(r.id),
  publisherId: (r.publisher_id as string | null) ?? null,
  offerId: (r.offer_id as string | null) ?? null,
  clientId: (r.client_id as string | null) ?? null,
  productId: (r.product_id as string | null) ?? null,
  campaignId: (r.campaign_id as string | null) ?? null,
  refCode: (r.ref_code as string | null) ?? null,
  status: r.status as Lead['status'],
  capturedData: (r.captured_data as Record<string, unknown>) ?? {},
  customerName: strOpt(r.customer_name),
  customerPhone: strOpt(r.customer_phone),
  customerEmail: strOpt(r.customer_email),
  dedupKey: strOpt(r.dedup_key),
  createdAt: iso(r.created_at),
  approvedAt: isoOpt(r.approved_at),
  paidAt: isoOpt(r.paid_at),
  rejectReason: strOpt(r.reject_reason),
});

export const leadToRow = (l: Partial<Lead>): Row =>
  compact({
    id: l.id,
    publisher_id: l.publisherId,
    offer_id: l.offerId,
    client_id: l.clientId,
    product_id: l.productId,
    campaign_id: l.campaignId,
    ref_code: l.refCode,
    status: l.status,
    captured_data: l.capturedData,
    customer_name: l.customerName,
    customer_phone: l.customerPhone,
    customer_email: l.customerEmail,
    dedup_key: l.dedupKey,
    created_at: l.createdAt,
    approved_at: l.approvedAt,
    paid_at: l.paidAt,
    reject_reason: l.rejectReason,
  });

// ── lead attributions ────────────────────────────────────────────────────────
export const leadAttributionFromRow = (r: Row): LeadAttribution => ({
  id: str(r.id),
  leadId: str(r.lead_id),
  publisherId: str(r.publisher_id),
  offerId: str(r.offer_id),
  clientId: str(r.client_id),
  referralLinkId: strOpt(r.referral_link_id),
  clickId: strOpt(r.click_id),
  source: r.source as LeadAttribution['source'],
  attributedAt: iso(r.attributed_at),
  attributedBy: strOpt(r.attributed_by),
  supersededAt: isoOpt(r.superseded_at),
  reason: strOpt(r.reason),
});

export const leadAttributionToRow = (a: Partial<LeadAttribution>): Row =>
  compact({
    id: a.id,
    lead_id: a.leadId,
    publisher_id: a.publisherId,
    offer_id: a.offerId,
    client_id: a.clientId,
    referral_link_id: a.referralLinkId,
    click_id: a.clickId,
    source: a.source,
    attributed_at: a.attributedAt,
    attributed_by: a.attributedBy,
    superseded_at: a.supersededAt,
    reason: a.reason,
  });

// ── commissions ──────────────────────────────────────────────────────────────
export const commissionFromRow = (r: Row): Commission => ({
  id: str(r.id),
  leadId: str(r.lead_id),
  publisherId: str(r.publisher_id),
  offerId: str(r.offer_id),
  clientId: str(r.client_id),
  amount: num(r.amount),
  currency: str(r.currency),
  model: r.model as Commission['model'],
  status: r.status as Commission['status'],
  payoutId: strOpt(r.payout_id),
  approvedBy: strOpt(r.approved_by),
  createdAt: iso(r.created_at),
  paidAt: isoOpt(r.paid_at),
  voidedAt: isoOpt(r.voided_at),
  voidReason: strOpt(r.void_reason),
});

export const commissionToRow = (c: Partial<Commission>): Row =>
  compact({
    id: c.id,
    lead_id: c.leadId,
    publisher_id: c.publisherId,
    offer_id: c.offerId,
    client_id: c.clientId,
    amount: c.amount,
    currency: c.currency,
    model: c.model,
    status: c.status,
    payout_id: c.payoutId,
    approved_by: c.approvedBy,
    created_at: c.createdAt,
    paid_at: c.paidAt,
    voided_at: c.voidedAt,
    void_reason: c.voidReason,
  });

// ── payouts ──────────────────────────────────────────────────────────────────
export const payoutFromRow = (r: Row): PayoutRow => ({
  id: str(r.id),
  publisherId: str(r.publisher_id),
  periodLabel: str(r.period_label),
  leadCount: num(r.lead_count),
  totalCommission: num(r.total_commission),
  status: r.status as PayoutRow['status'],
  method: r.method as PayoutRow['method'],
  reference: strOpt(r.reference),
  failureReason: strOpt(r.failure_reason),
  createdAt: iso(r.created_at),
  paidAt: isoOpt(r.paid_at),
});

export const payoutToRow = (p: Partial<PayoutRow>): Row =>
  compact({
    id: p.id,
    publisher_id: p.publisherId,
    period_label: p.periodLabel,
    lead_count: p.leadCount,
    total_commission: p.totalCommission,
    status: p.status,
    method: p.method,
    reference: p.reference,
    failure_reason: p.failureReason,
    created_at: p.createdAt,
    paid_at: p.paidAt,
  });

// ── audit ────────────────────────────────────────────────────────────────────
export const auditFromRow = (r: Row): AuditEntry => ({
  id: str(r.id),
  actor: str(r.actor),
  entity: str(r.entity),
  entityId: str(r.entity_id),
  action: str(r.action),
  detail: (r.detail as Record<string, unknown>) ?? {},
  occurredAt: iso(r.occurred_at),
});

export const auditToRow = (a: Partial<AuditEntry>): Row =>
  compact({
    id: a.id,
    actor: a.actor,
    entity: a.entity,
    entity_id: a.entityId,
    action: a.action,
    detail: a.detail,
    occurred_at: a.occurredAt,
  });

// ── inquiries ────────────────────────────────────────────────────────────────
export const inquiryFromRow = (r: Row): Inquiry => ({
  id: str(r.id),
  name: str(r.name),
  email: str(r.email),
  phone: strOpt(r.phone),
  company: strOpt(r.company),
  interestType: r.interest_type as Inquiry['interestType'],
  message: strOpt(r.message),
  consentGranted: Boolean(r.consent_granted),
  consentWording: strOpt(r.consent_wording),
  consentAt: isoOpt(r.consent_at),
  consentIp: strOpt(r.consent_ip),
  handled: Boolean(r.handled),
  createdAt: iso(r.created_at),
});

export const inquiryToRow = (i: Partial<Inquiry>): Row =>
  compact({
    id: i.id,
    name: i.name,
    email: i.email,
    phone: i.phone,
    company: i.company,
    interest_type: i.interestType,
    message: i.message,
    consent_granted: i.consentGranted,
    consent_wording: i.consentWording,
    consent_at: i.consentAt,
    consent_ip: i.consentIp,
    handled: i.handled,
    created_at: i.createdAt,
  });
