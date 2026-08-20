/**
 * The storage-agnostic contract every backend must satisfy.
 *
 * Services depend ONLY on this file — never on a concrete adapter or a storage SDK.
 * Swapping storage = providing a different implementation of these interfaces and
 * flipping `STORAGE_BACKEND`. The ESLint import-boundary rule enforces that
 * services/domain cannot reach past this contract.
 */
import type {
  AuditEntry,
  Buyer,
  Click,
  Contact,
  Lead,
  LeadStatus,
  Offer,
  PayoutRow,
  Publisher,
  ReferralLink,
} from '@/src/domain/types';

export interface DateRange {
  from?: string; // ISO 8601 inclusive
  to?: string; // ISO 8601 inclusive
}

export interface LeadFilter {
  publisherId?: string;
  offerId?: string;
  buyerId?: string;
  status?: LeadStatus;
  from?: string;
  to?: string;
}

export interface BuyerRepo {
  getById(id: string): Promise<Buyer | null>;
  list(filter?: Partial<Buyer>): Promise<Buyer[]>;
  create(b: Omit<Buyer, 'id' | 'createdAt'>): Promise<Buyer>;
  update(id: string, patch: Partial<Buyer>): Promise<Buyer>;
}

export interface PublisherRepo {
  getById(id: string): Promise<Publisher | null>;
  getByCode(code: string): Promise<Publisher | null>;
  getByAuthUserId(authUserId: string): Promise<Publisher | null>;
  list(filter?: Partial<Publisher>): Promise<Publisher[]>;
  create(p: Omit<Publisher, 'id' | 'createdAt'>): Promise<Publisher>;
  update(id: string, patch: Partial<Publisher>): Promise<Publisher>;
}

export interface OfferRepo {
  getById(id: string): Promise<Offer | null>;
  getByCode(code: string): Promise<Offer | null>;
  list(): Promise<Offer[]>;
  listActive(): Promise<Offer[]>;
  listByBuyer(buyerId: string): Promise<Offer[]>;
  create(o: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer>;
  update(id: string, patch: Partial<Offer>): Promise<Offer>;
}

export interface ReferralLinkRepo {
  getByCode(refCode: string): Promise<ReferralLink | null>;
  getByPublisherAndOffer(publisherId: string, offerId: string): Promise<ReferralLink | null>;
  listByPublisher(publisherId: string): Promise<ReferralLink[]>;
  create(r: Omit<ReferralLink, 'id' | 'createdAt'>): Promise<ReferralLink>;
}

export interface ClickRepo {
  /** Append-only. */
  append(c: Omit<Click, 'id'>): Promise<void>;
  listByPublisher(publisherId: string, range?: DateRange): Promise<Click[]>;
  /** True if a click with this dedup key was recorded within `withinMs`. */
  recentDedup(dedupKey: string, withinMs: number): Promise<boolean>;
}

export interface LeadRepo {
  /** Append-only create. */
  append(l: Omit<Lead, 'id'>): Promise<Lead>;
  getById(id: string): Promise<Lead | null>;
  list(filter?: LeadFilter): Promise<Lead[]>;
  updateStatus(id: string, status: LeadStatus, patch?: Partial<Lead>): Promise<Lead>;
  /** In-place field updates (manual assign, commission override). */
  update(id: string, patch: Partial<Lead>): Promise<Lead>;
}

export interface PayoutRepo {
  /** Create or update the payout row for a (publisher, period). */
  upsertPeriod(row: Omit<PayoutRow, 'id'>): Promise<PayoutRow>;
  getById(id: string): Promise<PayoutRow | null>;
  list(filter?: Partial<PayoutRow>): Promise<PayoutRow[]>;
  markPaid(id: string): Promise<PayoutRow>;
}

export interface AuditRepo {
  /** Append-only. */
  append(entry: Omit<AuditEntry, 'id'>): Promise<void>;
  list(filter?: Partial<AuditEntry>): Promise<AuditEntry[]>;
}

export interface ContactRepo {
  append(c: Omit<Contact, 'id'>): Promise<Contact>;
  list(filter?: Partial<Contact>): Promise<Contact[]>;
}

/** The complete set of repositories the application wires up behind one backend. */
export interface RepositoryBundle {
  buyers: BuyerRepo;
  publishers: PublisherRepo;
  offers: OfferRepo;
  referralLinks: ReferralLinkRepo;
  clicks: ClickRepo;
  leads: LeadRepo;
  payouts: PayoutRepo;
  audit: AuditRepo;
  contacts: ContactRepo;
}
