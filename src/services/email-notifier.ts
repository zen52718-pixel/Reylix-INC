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
import type { AdminNotifier } from '@/src/services/notifications';

export interface EmailNotifierConfig {
  apiKey: string;
  to: string;
  from: string;
  /** Defaults to Resend. Injected rather than read from module scope — see below. */
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
  constructor(private readonly config: EmailNotifierConfig) {}

  async notifyNewInquiry(inquiry: Inquiry): Promise<void> {
    await this.send(
      `New enquiry — ${inquiry.name}${inquiry.company ? ` (${inquiry.company})` : ''}`,
      inquiryLines(inquiry).join('\n'),
      { kind: 'new_inquiry', record: inquiry },
    );
  }

  async notifyNewLead(lead: Lead): Promise<void> {
    await this.send(`New lead — ${lead.customerName}`, leadLines(lead).join('\n'), {
      kind: 'new_lead',
      record: lead,
    });
  }

  /**
   * One retry, then give up loudly. Never throws: a delivery problem must not turn a
   * visitor's correct submission into an error page.
   */
  private async send(
    subject: string,
    text: string,
    context: { kind: string; record: unknown },
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
            to: [this.config.to],
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
    // recovered from, and mark it so it is greppable.
    console.error(
      JSON.stringify({
        event: 'admin_notify_failed',
        type: context.kind,
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
 */
export function emailNotifierConfig(env: {
  EMAIL_PROVIDER_API_KEY?: string;
  ADMIN_NOTIFY_EMAIL?: string;
  EMAIL_FROM?: string;
  EMAIL_API_ENDPOINT?: string;
}): EmailNotifierConfig | null {
  const apiKey = env.EMAIL_PROVIDER_API_KEY?.trim();
  const to = env.ADMIN_NOTIFY_EMAIL?.trim();
  const from = env.EMAIL_FROM?.trim();
  if (!apiKey || !to || !from) return null;
  return { apiKey, to, from, endpoint: env.EMAIL_API_ENDPOINT?.trim() || undefined };
}
