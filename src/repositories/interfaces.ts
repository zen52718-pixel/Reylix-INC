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
  Campaign,
  Click,
  Client,
  Commission,
  CommissionStatus,
  Inquiry,
  Lead,
  LeadAttribution,
  LeadStatus,
  Offer,
  PayoutRow,
  Product,
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
  clientId?: string;
  productId?: string;
  campaignId?: string;
  status?: LeadStatus;
  from?: string;
  to?: string;
}

export interface CommissionFilter {
  publisherId?: string;
  clientId?: string;
  offerId?: string;
  leadId?: string;
  payoutId?: string;
  status?: CommissionStatus;
}

export interface ClientRepo {
  getById(id: string): Promise<Client | null>;
  list(filter?: Partial<Client>): Promise<Client[]>;
  create(c: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  update(id: string, patch: Partial<Client>): Promise<Client>;
}

export interface ProductRepo {
  getById(id: string): Promise<Product | null>;
  getBySlug(slug: string): Promise<Product | null>;
  list(filter?: Partial<Product>): Promise<Product[]>;
  create(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  update(id: string, patch: Partial<Product>): Promise<Product>;
}

export interface CampaignRepo {
  getById(id: string): Promise<Campaign | null>;
  listByProduct(productId: string): Promise<Campaign[]>;
  list(filter?: Partial<Campaign>): Promise<Campaign[]>;
  create(c: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign>;
  update(id: string, patch: Partial<Campaign>): Promise<Campaign>;
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
  listByClient(clientId: string): Promise<Offer[]>;
  listByCampaign(campaignId: string): Promise<Offer[]>;
  create(o: Omit<Offer, 'id' | 'createdAt'>): Promise<Offer>;
  update(id: string, patch: Partial<Offer>): Promise<Offer>;
}

export interface ReferralLinkRepo {
  getById(id: string): Promise<ReferralLink | null>;
  getByCode(refCode: string): Promise<ReferralLink | null>;
  getByPublisherAndOffer(publisherId: string, offerId: string): Promise<ReferralLink | null>;
  listByPublisher(publisherId: string): Promise<ReferralLink[]>;
  create(r: Omit<ReferralLink, 'id' | 'createdAt'>): Promise<ReferralLink>;
}

export interface ClickRepo {
  /** Append-only. Returns the stored row so attribution can cite the exact click. */
  append(c: Omit<Click, 'id'>): Promise<Click>;
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
  /** In-place field updates (manual re-attribution denormalisation). */
  update(id: string, patch: Partial<Lead>): Promise<Lead>;
  /** Most recent lead sharing this consumer dedup key, for duplicate detection. */
  findRecentByDedupKey(dedupKey: string, withinMs: number): Promise<Lead | null>;
}

export interface LeadAttributionRepo {
  /** Append-only. */
  append(a: Omit<LeadAttribution, 'id'>): Promise<LeadAttribution>;
  /** The single non-superseded attribution for a lead, if any. */
  getCurrentForLead(leadId: string): Promise<LeadAttribution | null>;
  listByLead(leadId: string): Promise<LeadAttribution[]>;
  listByPublisher(publisherId: string): Promise<LeadAttribution[]>;
  /** Stamp `supersededAt` on the current row so a new attribution can replace it. */
  supersede(id: string, at: string, reason?: string): Promise<LeadAttribution>;
}

export interface CommissionRepo {
  create(c: Omit<Commission, 'id'>): Promise<Commission>;
  getById(id: string): Promise<Commission | null>;
  list(filter?: CommissionFilter): Promise<Commission[]>;
  /** The live (payable/processing/paid) commission for a lead, if one exists. */
  getLiveForLead(leadId: string): Promise<Commission | null>;
  update(id: string, patch: Partial<Commission>): Promise<Commission>;
}

export interface PayoutRepo {
  /** Create or update the payout row for a (publisher, period). */
  upsertPeriod(row: Omit<PayoutRow, 'id'>): Promise<PayoutRow>;
  getById(id: string): Promise<PayoutRow | null>;
  list(filter?: Partial<PayoutRow>): Promise<PayoutRow[]>;
  /** Move a payout to a new status, carrying any extra fields the transition needs. */
  transition(id: string, status: PayoutRow['status'], patch?: Partial<PayoutRow>): Promise<PayoutRow>;
}

export interface AuditRepo {
  /** Append-only. */
  append(entry: Omit<AuditEntry, 'id'>): Promise<void>;
  list(filter?: Partial<AuditEntry>): Promise<AuditEntry[]>;
}

export interface InquiryRepo {
  append(i: Omit<Inquiry, 'id'>): Promise<Inquiry>;
  list(filter?: Partial<Inquiry>): Promise<Inquiry[]>;
}

/** The complete set of repositories the application wires up behind one backend. */
export interface RepositoryBundle {
  clients: ClientRepo;
  products: ProductRepo;
  campaigns: CampaignRepo;
  publishers: PublisherRepo;
  offers: OfferRepo;
  referralLinks: ReferralLinkRepo;
  clicks: ClickRepo;
  leads: LeadRepo;
  leadAttributions: LeadAttributionRepo;
  commissions: CommissionRepo;
  payouts: PayoutRepo;
  audit: AuditRepo;
  inquiries: InquiryRepo;
}
