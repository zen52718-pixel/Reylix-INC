/**
 * Chooses how email leaves the machine, and refuses to guess.
 *
 * SMTP wins when it is configured, because it is the path this deployment actually uses:
 * the site runs on Hostinger, and Hostinger's DNS already authorises Hostinger to send for
 * reylixinc.com. Resend stays available and needs no code change to switch back to.
 *
 * Lives in `src/lib` because it constructs the SMTP transport, which imports a vendor SDK.
 */
import { createSmtpTransport } from '@/src/lib/smtp-transport';
import {
  createResendTransport,
  type EmailNotifierConfig,
  type MailTransport,
} from '@/src/services/email-notifier';

export interface MailEnv {
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_PROVIDER_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_API_ENDPOINT?: string;
  CONTACT_INQUIRY_EMAIL?: string;
  PUBLISHER_INQUIRY_EMAIL?: string;
  ADMIN_NOTIFY_EMAIL?: string;
}

function pickTransport(env: MailEnv): { transport: MailTransport; from: string } | null {
  const trim = (v?: string) => v?.trim() || undefined;

  const smtpUser = trim(env.SMTP_USER);
  const smtpPassword = trim(env.SMTP_PASSWORD);
  if (smtpUser && smtpPassword) {
    // The envelope sender has to be the mailbox we authenticated as, so it defaults to it.
    // A mismatch is rejected by the server, which is a 5xx and therefore not retried.
    const from = trim(env.EMAIL_FROM) ?? smtpUser;
    return {
      from,
      transport: createSmtpTransport({
        host: trim(env.SMTP_HOST) ?? 'smtp.hostinger.com',
        port: env.SMTP_PORT ?? 465,
        user: smtpUser,
        password: smtpPassword,
        from,
      }),
    };
  }

  const apiKey = trim(env.EMAIL_PROVIDER_API_KEY);
  const from = trim(env.EMAIL_FROM);
  if (apiKey && from) {
    return {
      from,
      transport: createResendTransport({ apiKey, from, endpoint: trim(env.EMAIL_API_ENDPOINT) }),
    };
  }

  return null;
}

/**
 * Build the notifier config, or null when email is not configured at all. A half-configured
 * path is worse than none: it looks like delivery is happening while nothing arrives.
 */
export function mailNotifierConfig(env: MailEnv): EmailNotifierConfig | null {
  const chosen = pickTransport(env);
  const contact = env.CONTACT_INQUIRY_EMAIL?.trim();
  const partner = env.PUBLISHER_INQUIRY_EMAIL?.trim();
  if (!chosen || !contact || !partner) return null;

  return {
    from: chosen.from,
    transport: chosen.transport,
    recipients: { contact, partner_application: partner },
    leads: env.ADMIN_NOTIFY_EMAIL?.trim() || undefined,
  };
}
