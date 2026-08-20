/**
 * Admin notification port (Blueprint Sprint 3 — "admin email notification on new lead").
 *
 * The business logic depends on this interface, not on an email provider. The default
 * implementation logs a structured event; wiring a real provider (env EMAIL_PROVIDER_API_KEY
 * → ADMIN_NOTIFY_EMAIL) is a drop-in replacement that keeps services unchanged.
 */
import type { Contact, Lead } from '@/src/domain/types';

export interface AdminNotifier {
  notifyNewLead(lead: Lead): Promise<void>;
  notifyNewContact(contact: Contact): Promise<void>;
}

export class LoggingAdminNotifier implements AdminNotifier {
  async notifyNewLead(lead: Lead): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'admin_notify',
        type: 'new_lead',
        leadId: lead.id,
        publisherId: lead.publisherId,
        offerId: lead.offerId,
        attributionSource: lead.attributionSource,
        customerName: lead.customerName,
      }),
    );
  }

  async notifyNewContact(contact: Contact): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'admin_notify',
        type: 'new_contact',
        contactId: contact.id,
        name: contact.name,
        interestType: contact.interestType,
      }),
    );
  }
}
