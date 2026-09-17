/**
 * Email admin notifier.
 *
 * This exists because the marketing forms currently have no durable store: with
 * `STORAGE_BACKEND=memory`, an inquiry lives only in the serverless invocation that received
 * it. Until Supabase is provisioned, THIS IS THE SYSTEM OF RECORD — the email is the only
 * copy of a submission that survives. Two consequences shape everything below:
 *
 * 1. The send is awaited, never fire-and-forget. A serverless function can be frozen the
 *    moment its response is returned, so an un-awaited fetch is a mail that never leaves.
 * 2. A failed send is logged with the COMPLETE submission at error level, so the record is
 *    recoverable from the platform log rather than lost.
 *
 * Provider: Resend (https://resend.com) over plain fetch — no SDK, so no dependency and no
 * supply-chain surface for something this small. Swapping providers means changing `send()`.
 *
 * The endpoint is injected through the config rather than read at module scope. A top-level
 * `process.env.X` in server code can be inlined at BUILD time by the bundler, which is how an
 * earlier version of this file silently kept talking to the default endpoint no matter what
 * the running process had configured.
 */
import type { Inquiry, Lead } from '@/src/domain/types';
import {
  LoggingAdminNotifier,
  type AdminNotifier,
  type InquiryChannel,
} from '@/src/services/notifications';

export interface EmailNotifierConfig {
  apiKey: string;
  from: string;
  /**
   * Where each public form's inquiries are delivered. Keyed by channel, so a caller names
   * which form a submission came from and never handles an address itself — there is exactly
   * one place a contact enquiry and a partner application could be mixed up, and it is here.
   */
  recipients: Record<InquiryChannel, string>;
  /** Recipient for lead notifications. Leads are not a website form; unset means log only. */
  leads?: string;
  /** Defaults to Resend. Injected rather than read from module scope — see above. */
  endpoint?: string;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Field order is the order a human wants to read them in, not the order of the type. */
function inquiryLines(inquiry: Inquiry): string[] {
  return [
    `Name:      ${inquiry.name}`,
    `Email:     ${inquiry.email}`,
    inquiry.phone ? `Phone:     ${inquiry.phone}` : null,
    inquiry.company ? `Company:   ${inquiry.company}` : null,
    `Interest:  ${inquiry.interestType}`,
    '',
    inquiry.message ? `${inquiry.message}` : '(no message)',
    '',
    '--- consent record ---',
    `Granted:   ${inquiry.consentGranted ? 'yes' : 'NO'}`,
    inquiry.consentAt ? `At:        ${inquiry.consentAt}` : null,
    inquiry.consentIp ? `From IP:   ${inquiry.consentIp}` : null,
    inquiry.consentWording ? `Wording:   ${inquiry.consentWording}` : null,
    '',
    `Inquiry ID: ${inquiry.id}`,
    `Received:   ${inquiry.createdAt}`,
  ].filter((l): l is string => l !== null);
}

function leadLines(lead: Lead): string[] {
  return [
    `Customer:  ${lead.customerName}`,
    `Lead ID:   ${lead.id}`,
    `Publisher: ${lead.publisherId ?? '(unattributed)'}`,
    `Offer:     ${lead.offerId ?? '—'}`,
    `Client:    ${lead.clientId ?? '—'}`,
  ];
}

export class EmailAdminNotifier implements AdminNotifier {
  private readonly fallback = new LoggingAdminNotifier();

  constructor(private readonly config: EmailNotifierConfig) {}

  async notifyNewInquiry(inquiry: Inquiry, channel: InquiryChannel): Promise<void> {
    await this.send(
      this.config.recipients[channel],
      `New enquiry — ${inquiry.name}${inquiry.company ? ` (${inquiry.company})` : ''}`,
      inquiryLines(inquiry).join('\n'),
      { kind: 'new_inquiry', channel, record: inquiry },
    );
  }

  async notifyNewLead(lead: Lead): Promise<void> {
    if (!this.config.leads) {
      await this.fallback.notifyNewLead(lead);
      return;
    }
    await this.send(this.config.leads, `New lead — ${lead.customerName}`, leadLines(lead).join('\n'), {
      kind: 'new_lead',
      record: lead,
    });
  }

  /**
   * One retry, then give up loudly. Never throws: a delivery problem must not turn a
   * visitor's correct submission into an error page.
   */
  private async send(
    to: string,
    subject: string,
    text: string,
    context: { kind: string; channel?: InquiryChannel; record: unknown },
  ): Promise<void> {
    let lastError = '';

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(this.config.endpoint ?? RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.config.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            from: this.config.from,
            to: [to],
            subject,
            text,
          }),
        });

        if (res.ok) return;

        lastError = `HTTP ${res.status}`;
        // 4xx is a configuration problem — a bad key, an unverified sender. Retrying an
        // identical request cannot fix it, so fail fast and say so.
        if (res.status < 500) break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    // The send failed and there is no other copy. Write the whole record where it can be
    // recovered from, and mark it so it is greppable. The intended recipient travels with it
    // so a recovered record can still reach the right inbox by hand.
    console.error(
      JSON.stringify({
        event: 'admin_notify_failed',
        type: context.kind,
        channel: context.channel,
        intendedRecipient: to,
        error: lastError,
        recoverable: true,
        record: context.record,
      }),
    );
  }
}

/**
 * Build the notifier only when it is completely configured. A half-configured email path is
 * worse than none: it looks like delivery is happening while nothing arrives.
 *
 * The provider credentials are required, and so are both inquiry recipients — but in the
 * running app `loadEnv()` always supplies the recipients, because `CONTACT_INQUIRY_EMAIL` and
 * `PUBLISHER_INQUIRY_EMAIL` default to the real inboxes. In production only the API key and
 * the sender need setting.
 */
export function emailNotifierConfig(env: {
  EMAIL_PROVIDER_API_KEY?: string;
  EMAIL_FROM?: string;
  CONTACT_INQUIRY_EMAIL?: string;
  PUBLISHER_INQUIRY_EMAIL?: string;
  ADMIN_NOTIFY_EMAIL?: string;
  EMAIL_API_ENDPOINT?: string;
}): EmailNotifierConfig | null {
  const apiKey = env.EMAIL_PROVIDER_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();
  const contact = env.CONTACT_INQUIRY_EMAIL?.trim();
  const partner = env.PUBLISHER_INQUIRY_EMAIL?.trim();
  if (!apiKey || !from || !contact || !partner) return null;
  return {
    apiKey,
    from,
    recipients: { contact, partner_application: partner },
    leads: env.ADMIN_NOTIFY_EMAIL?.trim() || undefined,
    endpoint: env.EMAIL_API_ENDPOINT?.trim() || undefined,
  };
}
