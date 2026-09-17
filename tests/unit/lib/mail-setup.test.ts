import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Which way mail leaves the machine, and what happens when the mail server misbehaves.
 *
 * nodemailer is mocked: these assert the wiring and the failure classification, not that a
 * third-party SMTP client can speak SMTP.
 */

const sendMail = vi.fn();
const createTransport = vi.fn((_options: Record<string, unknown>) => ({ sendMail }));

vi.mock('nodemailer', () => ({
  default: { createTransport },
  createTransport,
}));

const BASE = {
  CONTACT_INQUIRY_EMAIL: 'info@reylixinc.com',
  PUBLISHER_INQUIRY_EMAIL: 'publishers@reylixinc.com',
};

afterEach(() => {
  vi.clearAllMocks();
});

async function setup() {
  return import('@/src/lib/mail-setup');
}

/** The options nodemailer was configured with on the first (and only) createTransport call. */
function firstTransportOptions(): Record<string, unknown> {
  const call = createTransport.mock.calls[0];
  if (!call) throw new Error('nodemailer.createTransport was never called');
  return call[0];
}

describe('transport selection', () => {
  it('sends nothing when neither SMTP nor Resend is configured', async () => {
    const { mailNotifierConfig } = await setup();
    expect(mailNotifierConfig(BASE)).toBeNull();
  });

  it('ignores a half-configured SMTP setup rather than pretending to deliver', async () => {
    const { mailNotifierConfig } = await setup();
    expect(mailNotifierConfig({ ...BASE, SMTP_USER: 'noreply@reylixinc.com' })).toBeNull();
    expect(mailNotifierConfig({ ...BASE, SMTP_PASSWORD: 'secret' })).toBeNull();
  });

  it('uses SMTP when it is configured', async () => {
    const { mailNotifierConfig } = await setup();
    const config = mailNotifierConfig({
      ...BASE,
      SMTP_USER: 'noreply@reylixinc.com',
      SMTP_PASSWORD: 'secret',
    });

    expect(config?.transport.name).toBe('smtp');
    expect(createTransport).toHaveBeenCalledOnce();
    const opts = firstTransportOptions();
    // Hostinger's defaults, and 465 is implicit TLS.
    expect(opts.host).toBe('smtp.hostinger.com');
    expect(opts.port).toBe(465);
    expect(opts.secure).toBe(true);
    // Every timeout is set: the notifier awaits delivery, so a hung socket would hold a
    // visitor's form submission open.
    expect(opts.connectionTimeout).toBe(10_000);
    expect(opts.greetingTimeout).toBe(10_000);
    expect(opts.socketTimeout).toBe(10_000);
  });

  it('defaults the sender to the authenticated mailbox', async () => {
    const { mailNotifierConfig } = await setup();
    const config = mailNotifierConfig({
      ...BASE,
      SMTP_USER: 'noreply@reylixinc.com',
      SMTP_PASSWORD: 'secret',
    });
    expect(config?.from).toBe('noreply@reylixinc.com');
  });

  it('uses STARTTLS rather than implicit TLS on port 587', async () => {
    const { mailNotifierConfig } = await setup();
    mailNotifierConfig({
      ...BASE,
      SMTP_USER: 'noreply@reylixinc.com',
      SMTP_PASSWORD: 'secret',
      SMTP_PORT: 587,
    });
    expect(firstTransportOptions().secure).toBe(false);
  });

  it('prefers SMTP over Resend when both are configured', async () => {
    const { mailNotifierConfig } = await setup();
    const config = mailNotifierConfig({
      ...BASE,
      SMTP_USER: 'noreply@reylixinc.com',
      SMTP_PASSWORD: 'secret',
      EMAIL_PROVIDER_API_KEY: 'k',
      EMAIL_FROM: 'other@reylixinc.com',
    });
    expect(config?.transport.name).toBe('smtp');
  });

  it('falls back to Resend when SMTP is absent', async () => {
    const { mailNotifierConfig } = await setup();
    const config = mailNotifierConfig({
      ...BASE,
      EMAIL_PROVIDER_API_KEY: 'k',
      EMAIL_FROM: 'noreply@reylixinc.com',
    });
    expect(config?.transport.name).toBe('resend');
  });

  it('keeps routing the two forms to their own inboxes whichever transport is used', async () => {
    const { mailNotifierConfig } = await setup();
    for (const extra of [
      { SMTP_USER: 'noreply@reylixinc.com', SMTP_PASSWORD: 'secret' },
      { EMAIL_PROVIDER_API_KEY: 'k', EMAIL_FROM: 'noreply@reylixinc.com' },
    ]) {
      expect(mailNotifierConfig({ ...BASE, ...extra })?.recipients).toEqual({
        contact: 'info@reylixinc.com',
        partner_application: 'publishers@reylixinc.com',
      });
    }
  });
});

describe('SMTP failure classification', () => {
  async function smtpSend(failure: unknown) {
    const { mailNotifierConfig } = await setup();
    const config = mailNotifierConfig({
      ...BASE,
      SMTP_USER: 'noreply@reylixinc.com',
      SMTP_PASSWORD: 'secret',
    });
    sendMail.mockRejectedValueOnce(failure);
    return config!.transport.send({ to: 'a@b.com', subject: 's', text: 't' });
  }

  it('treats a 5xx SMTP reply as permanent — bad credentials never fix themselves', async () => {
    await expect(
      smtpSend(Object.assign(new Error('535 auth failed'), { responseCode: 535 })),
    ).rejects.toMatchObject({ retryable: false });
  });

  it('treats a 4xx SMTP reply as temporary', async () => {
    await expect(
      smtpSend(Object.assign(new Error('451 try later'), { responseCode: 451 })),
    ).rejects.toMatchObject({ retryable: true });
  });

  it('treats a socket error with no reply code as temporary', async () => {
    await expect(smtpSend(new Error('ETIMEDOUT'))).rejects.toMatchObject({ retryable: true });
  });

  it('sends from the configured mailbox', async () => {
    const { mailNotifierConfig } = await setup();
    const config = mailNotifierConfig({
      ...BASE,
      SMTP_USER: 'noreply@reylixinc.com',
      SMTP_PASSWORD: 'secret',
    });
    sendMail.mockResolvedValueOnce({ messageId: 'x' });

    await config!.transport.send({ to: 'info@reylixinc.com', subject: 'Hi', text: 'Body' });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'noreply@reylixinc.com',
      to: 'info@reylixinc.com',
      subject: 'Hi',
      text: 'Body',
    });
  });

  /** The password must never reach a log line. */
  it('does not put the password in the error it raises', async () => {
    await smtpSend(new Error('connection failed')).catch((err: Error) => {
      expect(err.message).not.toContain('secret');
    });
  });
});
