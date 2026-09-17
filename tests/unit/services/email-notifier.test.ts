import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Inquiry } from '@/src/domain/types';
import { EmailAdminNotifier, emailNotifierConfig } from '@/src/services/email-notifier';

/**
 * While there is no durable store, this notifier is the system of record for a public form
 * submission. These tests are about the failure modes, not the happy path: what happens to a
 * visitor's enquiry when the email provider is down, misconfigured, or unreachable.
 */

const CONFIG = {
  apiKey: 'test-key',
  from: 'site@example.com',
  recipients: { contact: 'info@reylixinc.com', partner_application: 'publishers@reylixinc.com' },
};

const INQUIRY: Inquiry = {
  id: 'inq-1',
  name: 'Dana Client',
  email: 'dana@example.com',
  phone: '+15551234567',
  company: 'Dana Co',
  interestType: 'client',
  message: 'Industry: Real Estate\n\nLooking to build a buyer acquisition system.',
  consentGranted: true,
  consentWording: 'I agree to be contacted…',
  consentAt: '2026-09-11T10:00:00.000Z',
  consentIp: '203.0.113.9',
  handled: false,
  createdAt: '2026-09-11T10:00:00.000Z',
};

type Call = unknown[];

let fetchMock: ReturnType<typeof vi.fn>;
let errorCalls: Call[];
let originalError: typeof console.error;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  originalError = console.error;
  errorCalls = [];
  console.error = (...args: unknown[]) => {
    errorCalls.push(args);
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
  console.error = originalError;
});

function loggedFailure(): Record<string, unknown> | null {
  const call = errorCalls.find((c) => String(c[0]).includes('admin_notify_failed'));
  return call ? (JSON.parse(String(call[0])) as Record<string, unknown>) : null;
}

const ROUTED_ENV = {
  EMAIL_PROVIDER_API_KEY: 'k',
  EMAIL_FROM: 'site@b.com',
  CONTACT_INQUIRY_EMAIL: 'info@reylixinc.com',
  PUBLISHER_INQUIRY_EMAIL: 'publishers@reylixinc.com',
};

describe('emailNotifierConfig', () => {
  it('returns null unless the key, the sender and both recipients are present', () => {
    expect(emailNotifierConfig({})).toBeNull();
    expect(emailNotifierConfig({ EMAIL_PROVIDER_API_KEY: 'k' })).toBeNull();
    expect(emailNotifierConfig({ ...ROUTED_ENV, EMAIL_FROM: undefined })).toBeNull();
    expect(emailNotifierConfig({ ...ROUTED_ENV, CONTACT_INQUIRY_EMAIL: undefined })).toBeNull();
    expect(emailNotifierConfig({ ...ROUTED_ENV, PUBLISHER_INQUIRY_EMAIL: undefined })).toBeNull();
  });

  it('maps each environment variable to its own channel', () => {
    expect(emailNotifierConfig(ROUTED_ENV)?.recipients).toEqual({
      contact: 'info@reylixinc.com',
      partner_application: 'publishers@reylixinc.com',
    });
  });

  it('keeps lead notifications separate from both form inboxes', () => {
    expect(emailNotifierConfig(ROUTED_ENV)?.leads).toBeUndefined();
    expect(emailNotifierConfig({ ...ROUTED_ENV, ADMIN_NOTIFY_EMAIL: 'ops@b.com' })?.leads).toBe(
      'ops@b.com',
    );
  });
});

describe('EmailAdminNotifier routing', () => {
  function sentTo(): string[] {
    const call = fetchMock.mock.calls[0] as [string, { body: string }];
    return (JSON.parse(call[1].body) as { to: string[] }).to;
  }

  it('delivers a contact enquiry to info@reylixinc.com', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'contact');
    expect(sentTo()).toEqual(['info@reylixinc.com']);
  });

  it('delivers a partner application to publishers@reylixinc.com', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'partner_application');
    expect(sentTo()).toEqual(['publishers@reylixinc.com']);
  });

  it('records the intended recipient when delivery fails, so it can be re-sent by hand', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'partner_application');
    expect(loggedFailure()).toMatchObject({
      channel: 'partner_application',
      intendedRecipient: 'publishers@reylixinc.com',
    });
  });
});

describe('EmailAdminNotifier', () => {
  it('sends the enquiry, including the consent record', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'contact');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(call[0]).toBe('https://api.resend.com/emails');
    expect(call[1].headers.authorization).toBe('Bearer test-key');

    const body = JSON.parse(call[1].body) as Record<string, string | string[]>;
    expect(body.to).toEqual(['info@reylixinc.com']);
    expect(body.from).toBe('site@example.com');
    expect(body.subject).toContain('Dana Client');
    // The consent record has to travel with the enquiry — it is the TCPA audit trail.
    expect(body.text).toContain('203.0.113.9');
    expect(body.text).toContain('I agree to be contacted');
    expect(body.text).toContain('buyer acquisition system');
    expect(loggedFailure()).toBeNull();
  });

  /**
   * Regression: the endpoint used to be a module-scope `process.env` read, which the bundler
   * inlined at build time — so the notifier kept posting to the default endpoint regardless
   * of what the running process was configured with.
   */
  it('posts to the configured endpoint, not a build-time constant', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await new EmailAdminNotifier({ ...CONFIG, endpoint: 'http://localhost:4555/emails' }).notifyNewInquiry(
      INQUIRY,
      'contact',
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:4555/emails');
  });

  it('carries an endpoint override out of the environment', () => {
    expect(
      emailNotifierConfig({ ...ROUTED_ENV, EMAIL_API_ENDPOINT: 'http://localhost:4555/emails' })
        ?.endpoint,
    ).toBe('http://localhost:4555/emails');
  });

  it('retries once on a 5xx and succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'contact');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(loggedFailure()).toBeNull();
  });

  it('does NOT retry a 4xx — a bad key or unverified sender cannot be fixed by repeating', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'contact');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * The important one. If delivery fails there is no other copy of the submission, so the
   * whole record must reach the platform log where it can be recovered by hand.
   */
  it('logs the complete submission when delivery fails', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    await new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'contact');

    const logged = loggedFailure();
    expect(logged).not.toBeNull();
    expect(logged?.event).toBe('admin_notify_failed');
    expect(logged?.recoverable).toBe(true);
    expect(logged?.error).toContain('ECONNRESET');
    expect(logged?.record).toMatchObject({
      id: 'inq-1',
      email: 'dana@example.com',
      consentIp: '203.0.113.9',
    });
  });

  it('never throws, whatever the provider does', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    await expect(
      new EmailAdminNotifier(CONFIG).notifyNewInquiry(INQUIRY, 'contact'),
    ).resolves.toBeUndefined();
  });
});
