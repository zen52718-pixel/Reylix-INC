import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Inquiry } from '@/src/domain/types';
import {
  createResendTransport,
  EmailAdminNotifier,
  MailTransportError,
  type MailMessage,
  type MailTransport,
} from '@/src/services/email-notifier';

/**
 * While there is no durable store, this notifier is the system of record for a public form
 * submission. These tests are mostly about the failure modes: what happens to a visitor's
 * enquiry when the mail path is down, misconfigured, or unreachable.
 */

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

/** A transport that records what it was asked to send and can be told to fail. */
function stubTransport(behaviour?: () => Promise<void>) {
  const sent: MailMessage[] = [];
  const transport: MailTransport = {
    name: 'stub',
    async send(message) {
      sent.push(message);
      if (behaviour) await behaviour();
    },
  };
  return { transport, sent };
}

function configWith(transport: MailTransport, leads?: string) {
  return {
    from: 'site@reylixinc.com',
    recipients: {
      contact: 'info@reylixinc.com',
      partner_application: 'publishers@reylixinc.com',
    },
    leads,
    transport,
  };
}

let errorCalls: unknown[][];
let originalError: typeof console.error;

beforeEach(() => {
  originalError = console.error;
  errorCalls = [];
  console.error = (...args: unknown[]) => {
    errorCalls.push(args);
  };
});

afterEach(() => {
  console.error = originalError;
  vi.unstubAllGlobals();
});

function loggedFailure(): Record<string, unknown> | null {
  const call = errorCalls.find((c) => String(c[0]).includes('admin_notify_failed'));
  return call ? (JSON.parse(String(call[0])) as Record<string, unknown>) : null;
}

describe('EmailAdminNotifier routing', () => {
  it('delivers a contact enquiry to info@reylixinc.com', async () => {
    const { transport, sent } = stubTransport();
    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(INQUIRY, 'contact');
    expect(sent.map((m) => m.to)).toEqual(['info@reylixinc.com']);
  });

  it('delivers a partner application to publishers@reylixinc.com', async () => {
    const { transport, sent } = stubTransport();
    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(
      INQUIRY,
      'partner_application',
    );
    expect(sent.map((m) => m.to)).toEqual(['publishers@reylixinc.com']);
  });

  it('carries the consent record, which is the TCPA audit trail', async () => {
    const { transport, sent } = stubTransport();
    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(INQUIRY, 'contact');

    const body = sent[0]?.text ?? '';
    expect(sent[0]?.subject).toContain('Dana Client');
    expect(body).toContain('203.0.113.9');
    expect(body).toContain('I agree to be contacted');
    expect(body).toContain('buyer acquisition system');
    expect(loggedFailure()).toBeNull();
  });

  it('logs the channel and intended recipient when delivery fails', async () => {
    const { transport } = stubTransport(() => {
      throw new MailTransportError('nope', false);
    });
    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(
      INQUIRY,
      'partner_application',
    );
    expect(loggedFailure()).toMatchObject({
      channel: 'partner_application',
      intendedRecipient: 'publishers@reylixinc.com',
      transport: 'stub',
    });
  });
});

describe('EmailAdminNotifier delivery behaviour', () => {
  it('retries a retryable failure once, then succeeds', async () => {
    let attempts = 0;
    const { transport } = stubTransport(async () => {
      attempts += 1;
      if (attempts === 1) throw new MailTransportError('temporary', true);
    });

    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(INQUIRY, 'contact');

    expect(attempts).toBe(2);
    expect(loggedFailure()).toBeNull();
  });

  /**
   * A bad password or an unverified sender fails identically every time. Retrying only
   * delays the visitor and buries the real cause.
   */
  it('does not retry a permanent failure', async () => {
    let attempts = 0;
    const { transport } = stubTransport(async () => {
      attempts += 1;
      throw new MailTransportError('bad credentials', false);
    });

    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(INQUIRY, 'contact');

    expect(attempts).toBe(1);
    expect(loggedFailure()).not.toBeNull();
  });

  it('logs the complete submission when delivery fails, so it is recoverable', async () => {
    const { transport } = stubTransport(async () => {
      throw new Error('ECONNRESET');
    });
    await new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(INQUIRY, 'contact');

    const logged = loggedFailure();
    expect(logged?.recoverable).toBe(true);
    expect(logged?.error).toContain('ECONNRESET');
    expect(logged?.record).toMatchObject({
      id: 'inq-1',
      email: 'dana@example.com',
      consentIp: '203.0.113.9',
    });
  });

  it('never throws, whatever the transport does', async () => {
    const { transport } = stubTransport(async () => {
      throw new Error('boom');
    });
    await expect(
      new EmailAdminNotifier(configWith(transport)).notifyNewInquiry(INQUIRY, 'contact'),
    ).resolves.toBeUndefined();
  });

  it('logs leads rather than emailing them when no lead recipient is configured', async () => {
    const { transport, sent } = stubTransport();
    const lead = { id: 'lead-1', customerName: 'Sam' } as never;
    await new EmailAdminNotifier(configWith(transport)).notifyNewLead(lead);
    expect(sent).toHaveLength(0);
  });
});

describe('createResendTransport', () => {
  it('posts to the configured endpoint, not a build-time constant', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await createResendTransport({
      apiKey: 'k',
      from: 'site@b.com',
      endpoint: 'http://localhost:4555/emails',
    }).send({ to: 'a@b.com', subject: 's', text: 't' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:4555/emails');
  });

  it('treats a 4xx as permanent and a 5xx as retryable', async () => {
    for (const [status, retryable] of [
      [403, false],
      [503, true],
    ] as const) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
      const send = createResendTransport({ apiKey: 'k', from: 'site@b.com' }).send({
        to: 'a@b.com',
        subject: 's',
        text: 't',
      });
      await expect(send).rejects.toMatchObject({ retryable });
    }
  });
});
