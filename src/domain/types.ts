/**
 * Storage-agnostic domain models.
 *
 * These are the single source of truth for the shapes the application reasons about.
 * Field names are camelCase here; the snake_case column names of the Supabase Postgres
 * tables are an adapter concern and map 1:1 to these properties. IDs are UUIDs;
 * timestamps are ISO 8601 strings; monetary values are numbers in USD.
 *
 * This module must never import the framework, a storage SDK, or a repository.
 */

// ── enums (as const-arrays so they are usable at runtime for validation) ──────

export const BUYER_STATUSES = ['active', 'paused', 'archived'] as const;
export type BuyerStatus = (typeof BUYER_STATUSES)[number];

export const PUBLISHER_STATUSES = ['pending', 'active', 'suspended'] as const;
export type PublisherStatus = (typeof PUBLISHER_STATUSES)[number];

export const LEAD_STATUSES = ['new', 'approved', 'rejected', 'paid'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ATTRIBUTION_SOURCES = ['param', 'cookie', 'manual', 'none'] as const;
export type AttributionSource = (typeof ATTRIBUTION_SOURCES)[number];

export const PAYOUT_STATUSES = ['pending', 'paid'] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYOUT_METHODS = ['ach', 'paypal', 'check', 'other'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const CONTACT_INTEREST_TYPES = ['brand', 'publisher', 'other'] as const;
export type ContactInterestType = (typeof CONTACT_INTEREST_TYPES)[number];

/** Default currency for all monetary values. US launch is USD-only. */
export const DEFAULT_CURRENCY = 'USD';

// ── entities ──────────────────────────────────────────────────────────────

/**
 * An advertiser who pays for approved leads. ADMIN-MANAGED in v1 — buyers have no login
 * and no self-serve portal; a buyer-facing role is reserved for a later phase.
 */
export interface Buyer {
  id: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: BuyerStatus;
  notes?: string;
  createdAt: string; // ISO 8601
}

/** An affiliate who submits or drives leads and earns commission. Self-serve portal. */
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
  payoutMethod?: PayoutMethod; // ach | paypal | check | other (manual payouts in v1)
  payoutDetails?: string;
  status: PublisherStatus;
  authUserId?: string; // Supabase Auth user id, set on provisioning
  createdAt: string; // ISO 8601
  approvedAt?: string;
}

/** A campaign a publisher can promote, always owned by exactly one buyer. */
export interface Offer {
  id: string;
  buyerId: string;
  offerCode: string; // unique, e.g. MVA1
  name: string;
  category?: string; // vertical, e.g. legal | home-services | insurance | solar
  description?: string;
  destinationUrl: string;
  commissionAmount: number; // default USD per approved lead; pre-fills the approval modal
  currency: string; // default USD
  isActive: boolean;
  createdAt: string;
}

export interface ReferralLink {
  id: string;
  publisherId: string;
  offerId: string;
  refCode: string; // deterministic {PUBLISHERCODE}-{OFFERCODE}, e.g. AHMED-MVA1
  createdAt: string;
}

/** Append-only event. */
export interface Click {
  id: string;
  refCode: string;
  publisherId: string;
  offerId: string;
  clickedAt: string;
  country?: string; // IP-derived
  deviceType?: string; // mobile | desktop | tablet
  userAgent?: string;
  dedupKey: string; // app-computed hash(ip + ua)
  isUnique: boolean; // app-computed at write
}

/** Append-only on create; status updated in place. */
export interface Lead {
  id: string;
  publisherId: string | null; // null = unattributed
  offerId: string | null;
  buyerId: string | null; // denormalized from the offer at capture, for buyer-side reporting
  refCode: string | null;
  attributionSource: AttributionSource;
  status: LeadStatus;
  commissionAmount: number; // USD, locked at approval from the admin-entered amount
  capturedData: Record<string, unknown>; // raw form fields
  customerName?: string; // denormalized for admin readability
  customerPhone?: string; // denormalized for admin readability
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectReason?: string; // required on reject; shown to the publisher
  // Per-lead admin commission override (falls back to the offer commission when disabled).
  commissionOverrideEnabled?: boolean;
  commissionOverrideAmount?: number;
}

export interface PayoutRow {
  id: string;
  publisherId: string;
  periodLabel: string; // e.g. 2026-05
  leadCount: number;
  totalCommission: number;
  status: PayoutStatus;
  createdAt: string;
  paidAt?: string;
}

/** Append-only. */
export interface AuditEntry {
  id: string;
  actor: string; // admin email / system
  entity: string; // lead | publisher | buyer | offer | payout
  entityId: string;
  action: string; // approved | rejected | paid | assigned | edited
  detail: Record<string, unknown>; // before/after
  occurredAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interestType: ContactInterestType;
  message?: string;
  handled: boolean;
  createdAt: string;
}
