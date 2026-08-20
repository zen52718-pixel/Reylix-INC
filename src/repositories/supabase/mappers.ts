/**
 * Row <-> domain mapping. The database speaks snake_case and timestamptz; the domain
 * speaks camelCase and ISO-8601 strings. This module is the ONLY place that translation
 * lives, so a column rename never reaches past the adapter.
 */
import type {
  AuditEntry,
  Buyer,
  Click,
  Contact,
  Lead,
  Offer,
  PayoutRow,
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

/** Drop undefined values so a partial patch never nulls a column it did not mention. */
export function compact(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

export const buyerFromRow = (r: Row): Buyer => ({
  id: str(r.id),
  company: str(r.company),
  contactName: str(r.contact_name),
  contactEmail: str(r.contact_email),
  contactPhone: strOpt(r.contact_phone),
  status: r.status as Buyer['status'],
  notes: strOpt(r.notes),
  createdAt: iso(r.created_at),
});

export const buyerToRow = (b: Partial<Buyer>): Row =>
  compact({
    id: b.id,
    company: b.company,
    contact_name: b.contactName,
    contact_email: b.contactEmail,
    contact_phone: b.contactPhone,
    status: b.status,
    notes: b.notes,
    created_at: b.createdAt,
  });

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

export const offerFromRow = (r: Row): Offer => ({
  id: str(r.id),
  buyerId: str(r.buyer_id),
  offerCode: str(r.offer_code),
  name: str(r.name),
  category: strOpt(r.category),
  description: strOpt(r.description),
  destinationUrl: str(r.destination_url),
  commissionAmount: num(r.commission_amount),
  currency: str(r.currency),
  isActive: Boolean(r.is_active),
  createdAt: iso(r.created_at),
});

export const offerToRow = (o: Partial<Offer>): Row =>
  compact({
    id: o.id,
    buyer_id: o.buyerId,
    offer_code: o.offerCode,
    name: o.name,
    category: o.category,
    description: o.description,
    destination_url: o.destinationUrl,
    commission_amount: o.commissionAmount,
    currency: o.currency,
    is_active: o.isActive,
    created_at: o.createdAt,
  });

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

export const clickFromRow = (r: Row): Click => ({
  id: str(r.id),
  refCode: str(r.ref_code),
  publisherId: str(r.publisher_id),
  offerId: str(r.offer_id),
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
    clicked_at: c.clickedAt,
    country: c.country,
    device_type: c.deviceType,
    user_agent: c.userAgent,
    dedup_key: c.dedupKey,
    is_unique: c.isUnique,
  });

export const leadFromRow = (r: Row): Lead => ({
  id: str(r.id),
  publisherId: (r.publisher_id as string | null) ?? null,
  offerId: (r.offer_id as string | null) ?? null,
  buyerId: (r.buyer_id as string | null) ?? null,
  refCode: (r.ref_code as string | null) ?? null,
  attributionSource: r.attribution_source as Lead['attributionSource'],
  status: r.status as Lead['status'],
  commissionAmount: num(r.commission_amount),
  capturedData: (r.captured_data as Record<string, unknown>) ?? {},
  customerName: strOpt(r.customer_name),
  customerPhone: strOpt(r.customer_phone),
  createdAt: iso(r.created_at),
  approvedAt: isoOpt(r.approved_at),
  paidAt: isoOpt(r.paid_at),
  rejectReason: strOpt(r.reject_reason),
  commissionOverrideEnabled:
    r.commission_override_enabled == null ? undefined : Boolean(r.commission_override_enabled),
  commissionOverrideAmount:
    r.commission_override_amount == null ? undefined : num(r.commission_override_amount),
});

export const leadToRow = (l: Partial<Lead>): Row =>
  compact({
    id: l.id,
    publisher_id: l.publisherId,
    offer_id: l.offerId,
    buyer_id: l.buyerId,
    ref_code: l.refCode,
    attribution_source: l.attributionSource,
    status: l.status,
    commission_amount: l.commissionAmount,
    captured_data: l.capturedData,
    customer_name: l.customerName,
    customer_phone: l.customerPhone,
    created_at: l.createdAt,
    approved_at: l.approvedAt,
    paid_at: l.paidAt,
    reject_reason: l.rejectReason,
    commission_override_enabled: l.commissionOverrideEnabled,
    commission_override_amount: l.commissionOverrideAmount,
  });

export const payoutFromRow = (r: Row): PayoutRow => ({
  id: str(r.id),
  publisherId: str(r.publisher_id),
  periodLabel: str(r.period_label),
  leadCount: num(r.lead_count),
  totalCommission: num(r.total_commission),
  status: r.status as PayoutRow['status'],
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
    created_at: p.createdAt,
    paid_at: p.paidAt,
  });

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

export const contactFromRow = (r: Row): Contact => ({
  id: str(r.id),
  name: str(r.name),
  email: str(r.email),
  phone: strOpt(r.phone),
  company: strOpt(r.company),
  interestType: r.interest_type as Contact['interestType'],
  message: strOpt(r.message),
  handled: Boolean(r.handled),
  createdAt: iso(r.created_at),
});

export const contactToRow = (c: Partial<Contact>): Row =>
  compact({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    interest_type: c.interestType,
    message: c.message,
    handled: c.handled,
    created_at: c.createdAt,
  });
