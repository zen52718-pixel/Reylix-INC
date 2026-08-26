/**
 * Storage-agnostic domain models.
 *
 * These are the single source of truth for the shapes the application reasons about.
 * Field names are camelCase here; the snake_case column names of the Supabase Postgres
 * tables are an adapter concern and map 1:1 to these properties. IDs are UUIDs;
 * timestamps are ISO 8601 strings; monetary values are numbers in USD.
 *
 * VOCABULARY — the distinction the whole model rests on:
 *   Client   — the business purchasing acquisition services (e.g. a realtor).
 *   Lead     — a CONSUMER acquired for that client (e.g. someone buying a house).
 *   Publisher— a partner who drives traffic and earns commission.
 *   Inquiry  — someone contacting Reylix itself through the public website.
 * These are four different things and must never be collapsed into one another.
 *
 * This module must never import the framework, a storage SDK, or a repository.
 */

// ── enums (as const-arrays so they are usable at runtime for validation) ──────

export const CLIENT_STATUSES = ['active', 'paused', 'archived'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PRODUCT_STATUSES = [
  'planned',
  'in_development',
  'available',
  'retired',
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PUBLISHER_STATUSES = ['pending', 'active', 'suspended'] as const;
export type PublisherStatus = (typeof PUBLISHER_STATUSES)[number];

export const LEAD_STATUSES = ['new', 'approved', 'rejected', 'paid'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/**
 * How credit for a lead was decided. There is deliberately no 'none' member: an
 * unattributed lead has no LeadAttribution row at all, which is a different and more
 * honest statement than a row claiming attribution to nobody.
 */
export const ATTRIBUTION_SOURCES = ['param', 'cookie', 'manual'] as const;
export type AttributionSource = (typeof ATTRIBUTION_SOURCES)[number];

/**
 * Commission pricing models. All six are representable so an offer can declare its terms;
 * only `flat` is calculated by the service layer in V1 (see CommissionService).
 */
export const COMMISSION_MODELS = ['flat', 'cpl', 'cpa', 'cpq', 'revshare', 'custom'] as const;
export type CommissionModel = (typeof COMMISSION_MODELS)[number];

export const COMMISSION_STATUSES = [
  'payable',
  'processing',
  'paid',
  'void',
  'clawed_back',
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

/** A commission in one of these states is still money owed and must not be re-earned. */
export const LIVE_COMMISSION_STATUSES = ['payable', 'processing', 'paid'] as const;

export const PAYOUT_STATUSES = ['pending', 'approved', 'processing', 'paid', 'failed'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYOUT_METHODS = ['ach', 'paypal', 'check', 'other'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const INQUIRY_INTEREST_TYPES = ['client', 'publisher', 'other'] as const;
export type InquiryInterestType = (typeof INQUIRY_INTEREST_TYPES)[number];

/** Default currency for all monetary values. US launch is USD-only. */
export const DEFAULT_CURRENCY = 'USD';

// ── entities ──────────────────────────────────────────────────────────────

/**
 * The business purchasing acquisition services and receiving consumer leads.
 *
 * ADMIN-MANAGED: clients have no login and no self-serve portal in this phase.
 * Replaces the former `Buyer` entity one-for-one.
 */
export interface Client {
  id: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string; // ISO 8601
}

/**
 * A vertical acquisition system Reylix builds and owns — Real Estate, Home Services,
 * Legal, Insurance.
 *
 * Deliberately client-agnostic. A product carries no client reference of any kind; that
 * is what lets one product serve many clients without being rebuilt per client.
 */
export interface Product {
  id: string;
  slug: string; // unique, e.g. real-estate
  name: string;
  description?: string;
  status: ProductStatus;
  createdAt: string;
}

/**
 * An acquisition program within a product, typically scoped to a market.
 * Example: Real Estate → Rochester.
 */
export interface Campaign {
  id: string;
  productId: string;
  slug: string; // unique within the product
  name: string;
  market?: string;
  /**
   * Consumer de-duplication window in minutes, inherited by this campaign's offers
   * unless the offer sets its own. Null means "not configured at this level" — see
   * `resolveLeadDedupWindow` in value-objects.
   */
  leadDedupWindowMinutes?: number;
  isActive: boolean;
  createdAt: string;
}

/**
 * The commercial unit: deliver leads of a given type to a given client at a given price.
 * This is what a publisher promotes, and where the client relationship attaches.
 */
export interface Offer {
  id: string;
  campaignId: string;
  clientId: string;
  offerCode: string; // unique, e.g. MVA1
  name: string;
  description?: string;
  destinationUrl: string;
  commissionModel: CommissionModel;
  commissionAmount: number; // default USD per approved lead; pre-fills the approval step
  currency: string; // default USD
  /** Overrides the campaign window when set. Null means "inherit from the campaign". */
  leadDedupWindowMinutes?: number;
  isActive: boolean;
  createdAt: string;
}

/** An affiliate who drives traffic to offers and earns commission. */
export interface Publisher {
  id: string;
  publisherCode: string; // unique, e.g. AHMED
  fullName: string;
  email: string; // unique
  phone: string;
  country?: string;
  city?: string;
  audienceType?: string; // paid | seo | social | email | other
  promoDescription?: string;
  payoutMethod?: PayoutMethod;
  payoutDetails?: string;
  status: PublisherStatus;
  authUserId?: string; // Supabase Auth user id, set on provisioning
  createdAt: string;
  approvedAt?: string;
}

export interface ReferralLink {
  id: string;
  publisherId: string;
  offerId: string;
  refCode: string; // deterministic {PUBLISHERCODE}-{OFFERCODE}, e.g. AHMED-MVA1
  createdAt: string;
}

/** Append-only traffic event. */
export interface Click {
  id: string;
  refCode: string;
  publisherId: string;
  offerId: string;
  referralLinkId?: string;
  clickedAt: string;
  country?: string;
  deviceType?: string;
  userAgent?: string;
  dedupKey: string; // app-computed hash(refCode + ip + ua)
  isUnique: boolean; // app-computed at write
}

/**
 * A CONSUMER acquired for a client — the person who wants to buy or sell, get a quote,
 * book a service. Never the client, never an inbound enquiry to Reylix.
 *
 * publisherId / refCode / clientId / productId / campaignId are denormalized for query
 * convenience. The system of record for credit is LeadAttribution; the system of record
 * for money is Commission.
 */
export interface Lead {
  id: string;
  publisherId: string | null; // null = unattributed
  offerId: string | null;
  clientId: string | null;
  productId: string | null;
  campaignId: string | null;
  refCode: string | null;
  status: LeadStatus;
  capturedData: Record<string, unknown>; // raw form fields
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Hash identifying the same consumer on the same offer, for de-duplication. */
  dedupKey?: string;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectReason?: string; // required on reject; shown to the publisher
}

/**
 * The record of who was credited for a lead, and why.
 *
 * Append-only: re-attributing a lead supersedes the previous row rather than editing it,
 * so a commission dispute can be answered with evidence of what was decided and when.
 * Exactly one row per lead may have `supersededAt` unset.
 */
export interface LeadAttribution {
  id: string;
  leadId: string;
  publisherId: string;
  offerId: string;
  clientId: string;
  referralLinkId?: string;
  clickId?: string;
  source: AttributionSource;
  attributedAt: string;
  attributedBy?: string; // required when source = 'manual'
  supersededAt?: string;
  reason?: string;
}

/**
 * What a publisher earned for one lead.
 *
 * A record rather than a column on the lead, which is what makes a payout lifecycle and
 * a clawback expressible. The amount is immutable once written: a correction is a void
 * plus a new record, never an edit.
 */
export interface Commission {
  id: string;
  leadId: string;
  publisherId: string;
  offerId: string;
  clientId: string;
  amount: number;
  currency: string;
  model: CommissionModel;
  status: CommissionStatus;
  payoutId?: string;
  approvedBy?: string;
  createdAt: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
}

/** A batch of commissions paid to one publisher for one period. */
export interface PayoutRow {
  id: string;
  publisherId: string;
  periodLabel: string; // e.g. 2026-05
  leadCount: number;
  totalCommission: number;
  status: PayoutStatus;
  method?: PayoutMethod;
  reference?: string; // bank/PayPal reference once sent
  failureReason?: string; // required when status = 'failed'
  createdAt: string;
  paidAt?: string;
}

/** Append-only trail of privileged actions. */
export interface AuditEntry {
  id: string;
  actor: string; // admin email / system
  entity: string; // lead | publisher | client | product | campaign | offer | commission | payout
  entityId: string;
  action: string;
  detail: Record<string, unknown>; // before/after
  occurredAt: string;
}

/**
 * An inbound enquiry to Reylix INC from the public website.
 *
 * NOT a consumer lead: it has no attribution, no offer, no client and earns no
 * commission. NOT a client contact: it belongs to no client. It is the company's front
 * door, and may later be promoted into a Client or a publisher application — a workflow,
 * not a change of identity.
 */
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interestType: InquiryInterestType;
  message?: string;
  // Consent is first-class rather than prose in the message, so it is queryable and
  // auditable. Required before any phone or SMS outreach.
  consentGranted: boolean;
  consentWording?: string;
  consentAt?: string;
  consentIp?: string;
  handled: boolean;
  createdAt: string;
}
