/**
 * InquiryService — inbound enquiries to Reylix INC from the public marketing website.
 *
 * An Inquiry is NOT a consumer lead: it carries no attribution, belongs to no offer or
 * client, and earns no commission. It is also NOT a client contact record. Keeping it a
 * separate entity is what stops the company's front-door inbox being mixed into the
 * acquisition pipeline.
 *
 * Consent is stored as first-class fields rather than prose, so it is queryable and
 * auditable before any phone or SMS outreach happens.
 */
import { ValidationError } from '@/src/domain/errors';
import type { Inquiry, InquiryInterestType } from '@/src/domain/types';
import { INQUIRY_INTEREST_TYPES } from '@/src/domain/types';
import type { InquiryRepo } from '@/src/repositories/interfaces';
import type { AdminNotifier, InquiryChannel } from '@/src/services/notifications';

export interface CreateInquiryInput {
  /**
   * The form this inquiry came through, which decides the inbox it is delivered to.
   * Required, with no default: a new form that forgot to set it would otherwise land in
   * whichever inbox the default happened to be, and nobody would notice.
   */
  channel: InquiryChannel;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interestType?: string;
  message?: string;
  consentGranted?: boolean;
  consentWording?: string;
  consentAt?: string;
  consentIp?: string;
}

export class InquiryService {
  constructor(
    private readonly inquiries: InquiryRepo,
    private readonly notifier: AdminNotifier,
  ) {}

  async create(input: CreateInquiryInput): Promise<Inquiry> {
    const name = (input.name ?? '').trim();
    const email = (input.email ?? '').trim().toLowerCase();
    if (!name) throw new ValidationError('name is required', { field: 'name' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('a valid email is required', { field: 'email' });
    }
    const interestType: InquiryInterestType = INQUIRY_INTEREST_TYPES.includes(
      input.interestType as InquiryInterestType,
    )
      ? (input.interestType as InquiryInterestType)
      : 'other';

    const consentGranted = input.consentGranted === true;

    const inquiry = await this.inquiries.append({
      name,
      email,
      phone: input.phone?.trim() || undefined,
      company: input.company?.trim() || undefined,
      interestType,
      message: input.message?.trim() || undefined,
      consentGranted,
      // Only meaningful when consent was actually granted; storing wording or a timestamp
      // beside a false flag would misrepresent what happened.
      consentWording: consentGranted ? input.consentWording?.trim() || undefined : undefined,
      consentAt: consentGranted ? (input.consentAt ?? new Date().toISOString()) : undefined,
      consentIp: consentGranted ? input.consentIp?.trim() || undefined : undefined,
      handled: false,
      createdAt: new Date().toISOString(),
    });
    /**
     * Awaited, not fire-and-forget. A serverless function can be frozen the instant its
     * response is returned, so an un-awaited send is a notification that never leaves the
     * machine — and while there is no durable store, that notification IS the record.
     *
     * The notifier never throws; it logs the full submission if delivery fails. The catch
     * here is belt-and-braces so a future notifier cannot turn a good submission into a 500.
     */
    try {
      await this.notifier.notifyNewInquiry(inquiry, input.channel);
    } catch {
      // Already logged by the notifier. The visitor did nothing wrong.
    }
    return inquiry;
  }

  async list(filter?: Partial<Inquiry>): Promise<Inquiry[]> {
    return this.inquiries.list(filter);
  }
}
