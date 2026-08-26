/**
 * Admin notification port.
 *
 * The business logic depends on this interface, not on an email provider. The default
 * implementation logs a structured event; wiring a real provider (env EMAIL_PROVIDER_API_KEY
 * → ADMIN_NOTIFY_EMAIL) is a drop-in replacement that keeps services unchanged.
 */
import type { Inquiry, Lead } from '@/src/domain/types';

export interface AdminNotifier {
  notifyNewLead(lead: Lead): Promise<void>;
  notifyNewInquiry(inquiry: Inquiry): Promise<void>;
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
        clientId: lead.clientId,
        customerName: lead.customerName,
      }),
    );
  }

  async notifyNewInquiry(inquiry: Inquiry): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'admin_notify',
        type: 'new_inquiry',
        inquiryId: inquiry.id,
        name: inquiry.name,
        interestType: inquiry.interestType,
      }),
    );
  }
}
