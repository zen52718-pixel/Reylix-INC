/**
 * Email admin notifier.
 *
 * This exists because the marketing forms currently have no durable store: with
 * `STORAGE_BACKEND=memory`, an inquiry lives only in the process that received it. Until
 * Supabase is provisioned, THIS IS THE SYSTEM OF RECORD — the email is the only copy of a
 * submission that survives. Two consequences shape everything below:
 *
 * 1. The send is awaited, never fire-and-forget.
 * 2. A failed send is logged with the COMPLETE submission at error level, so the record is
 *    recoverable from the platform log rather than lost.
 *
 * How the mail physically leaves the machine is a `MailTransport`. This class owns what does
 * NOT change between providers — which inbox a form routes to, retrying, and what happens
 * when delivery fails — so switching transports cannot quietly change any of it.
 *
 * Transports must not be imported here: `src/services` is business logic and stays free of
 * vendor SDKs. The SMTP transport lives in `src/lib` and is injected by the composition root.
 */
import type { Inquiry, Lead } from '@/src/domain/types';
import {
  LoggingAdminNotifier,
  type AdminNotifier,
  type InquiryChannel,
} from '@/src/services/notifications';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/** A way to put a message on the wire. Throws on failure; never returns a status. */
export interface MailTransport {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}

/**
 * Transport failure. `retryable` separates "try again" from "this will never work": a bad
 * password or an unverified sender fails identically on every attempt, so repeating it just
 * delays the visitor and buries the real cause.
 */
export class MailTransportError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'MailTransportError';
  }
}

export interface EmailNotifierConfig {
  from: string;
  /**
   * Where each public form's inquiries are delivered. Keyed by channel, so a caller names
   * which form a submission came from and never handles an address itself — there is exactly
   * one place a contact enquiry and a partner application could be mixed up, and it is here.
   */
  recipients: Record<InquiryChannel, string>;
  /** Recipient for lead notifications. Leads are not a website form; unset means log only. */
  leads?: string;
  transport: MailTransport;
}

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
    await this.deliver(
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
    await this.deliver(
      this.config.leads,
      `New lead — ${lead.customerName}`,
      leadLines(lead).join('\n'),
      { kind: 'new_lead', record: lead },
    );
  }

  /**
   * One retry for a transient failure, then give up loudly. Never throws: a delivery problem
   * must not turn a visitor's correct submission into an error page.
   */
  private async deliver(
    to: string,
    subject: string,
    text: string,
    context: { kind: string; channel?: InquiryChannel; record: unknown },
  ): Promise<void> {
    let lastError = '';

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.config.transport.send({ to, subject, text });
        return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (err instanceof MailTransportError && !err.retryable) break;
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
        transport: this.config.transport.name,
        intendedRecipient: to,
        error: lastError,
        recoverable: true,
        record: context.record,
      }),
    );
  }
}

// ---------------------------------------------------------------------------------------
// Resend transport (HTTP). Kept here because it needs no SDK — just `fetch`.
// ---------------------------------------------------------------------------------------

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function createResendTransport(options: {
  apiKey: string;
  from: string;
  endpoint?: string;
}): MailTransport {
  return {
    name: 'resend',
    async send({ to, subject, text }) {
      let res: Response;
      try {
        res = await fetch(options.endpoint ?? RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ from: options.from, to: [to], subject, text }),
        });
      } catch (err) {
        // Network-level failure: worth one more attempt.
        throw new MailTransportError(err instanceof Error ? err.message : String(err), true);
      }
      if (res.ok) return;
      // 4xx is a configuration problem — a bad key, an unverified sender. Retrying an
      // identical request cannot fix it.
      throw new MailTransportError(`HTTP ${res.status}`, res.status >= 500);
    },
  };
}
