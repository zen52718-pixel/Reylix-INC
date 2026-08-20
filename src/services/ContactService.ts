/**
 * ContactService (Blueprint §4.1) — public contact/consultation intake. Creates a Contacts
 * row and notifies admin. Storage-agnostic.
 */
import { ValidationError } from '@/src/domain/errors';
import type { Contact, ContactInterestType } from '@/src/domain/types';
import { CONTACT_INTEREST_TYPES } from '@/src/domain/types';
import type { ContactRepo } from '@/src/repositories/interfaces';
import type { AdminNotifier } from '@/src/services/notifications';

export interface CreateContactInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  interestType?: string;
  message?: string;
}

export class ContactService {
  constructor(
    private readonly contacts: ContactRepo,
    private readonly notifier: AdminNotifier,
  ) {}

  async create(input: CreateContactInput): Promise<Contact> {
    const name = (input.name ?? '').trim();
    const email = (input.email ?? '').trim().toLowerCase();
    if (!name) throw new ValidationError('name is required', { field: 'name' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('a valid email is required', { field: 'email' });
    }
    const interestType: ContactInterestType = CONTACT_INTEREST_TYPES.includes(
      input.interestType as ContactInterestType,
    )
      ? (input.interestType as ContactInterestType)
      : 'other';

    const contact = await this.contacts.append({
      name,
      email,
      phone: input.phone?.trim() || undefined,
      company: input.company?.trim() || undefined,
      interestType,
      message: input.message?.trim() || undefined,
      handled: false,
      createdAt: new Date().toISOString(),
    });
    void this.notifier.notifyNewContact(contact).catch(() => undefined);
    return contact;
  }
}
