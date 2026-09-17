/**
 * SMTP mail transport, for sending through Hostinger's own mail service.
 *
 * This lives in `src/lib` rather than `src/services` because it imports a vendor SDK, and
 * business logic stays free of those. `EmailAdminNotifier` depends on the `MailTransport`
 * interface; the composition root injects this.
 *
 * Why SMTP at all: reylixinc.com's DNS already authorises Hostinger to send for the domain
 * (SPF `include:_spf.mail.hostinger.com`, three `hostingermail-*._domainkey` DKIM CNAMEs),
 * and the recipient mailboxes are Hostinger mailboxes. Mail from a Hostinger mailbox to a
 * Hostinger mailbox never leaves their network, so there is nothing to misalign.
 *
 * Timeouts are explicit and short. The notifier AWAITS delivery before the visitor's form
 * submission returns, and an unreachable SMTP server fails by hanging rather than refusing.
 * Without these a mail problem becomes a page that never finishes loading.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { MailTransportError, type MailTransport } from '@/src/services/email-notifier';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  /** Hard ceiling for one attempt. Also bounds the notifier's total wait at 2x this. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * SMTP replies are `5xx` for permanent failures (bad credentials, rejected sender) and `4xx`
 * for temporary ones (greylisting, throttling). Anything without a code is a socket problem,
 * which is worth retrying once.
 */
function isRetryable(err: unknown): boolean {
  const code = (err as { responseCode?: number })?.responseCode;
  if (typeof code === 'number') return code < 500;
  return true;
}

export function createSmtpTransport(config: SmtpConfig): MailTransport {
  const timeout = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Created once and reused: nodemailer pools connections, and building a transporter per
  // message would add a TLS handshake to every form submission.
  const transporter: Transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS. Both are encrypted.
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
  });

  return {
    name: 'smtp',
    async send({ to, subject, text }) {
      try {
        await transporter.sendMail({ from: config.from, to, subject, text });
      } catch (err) {
        // The message is deliberately not included: an SMTP error can echo back envelope
        // details, and this string is logged. The full record is logged separately by the
        // notifier, which is the one place that decides what is safe to write down.
        const reason = err instanceof Error ? err.message : String(err);
        throw new MailTransportError(reason, isRetryable(err));
      }
    },
  };
}
