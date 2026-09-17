/**
 * Admin notification port.
 *
 * The business logic depends on this interface, not on an email provider. The default
 * implementation logs a structured event; the email implementation in `email-notifier.ts`
 * is a drop-in replacement that keeps services unchanged.
 */
import type { Inquiry, Lead } from '@/src/domain/types';

/**
 * Which public form an inquiry arrived through. Notifications are routed by this, and ONLY
 * by this.
 *
 * It is deliberately not inferred from `interestType`: the contact form's API accepts
 * `interestType: 'publisher'`, so routing on that field would let a contact submission reach
 * the publisher inbox. The channel is fixed by the endpoint that received the request.
 */
export const INQUIRY_CHANNELS = ['contact', 'partner_application'] as const;
export type InquiryChannel = (typeof INQUIRY_CHANNELS)[number];

export interface AdminNotifier {
  notifyNewLead(lead: Lead): Promise<void>;
  notifyNewInquiry(inquiry: Inquiry, channel: InquiryChannel): Promise<void>;
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

  async notifyNewInquiry(inquiry: Inquiry, channel: InquiryChannel): Promise<void> {
    console.info(
      JSON.stringify({
        event: 'admin_notify',
        type: 'new_inquiry',
        channel,
        inquiryId: inquiry.id,
        name: inquiry.name,
        interestType: inquiry.interestType,
      }),
    );
  }
}
