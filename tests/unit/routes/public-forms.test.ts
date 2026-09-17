/**
 * 9 · The existing public contact and partner forms still work.
 *
 * These call the real route handlers with the exact payloads the shipped website sends —
 * including `interestType: 'brand'`, the value the public site was built with. The whole
 * point of the boundary alias is that this keeps working without a single component
 * change, so this suite is what proves the website was not broken by the migration.
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as becomeAPartner } from '@/app/api/become-a-partner/route';
import { POST as contact } from '@/app/api/contact/route';
import { __resetEnv } from '@/src/config/env';
import { __resetRepositories, getRepositories } from '@/src/repositories';
import { __resetServices } from '@/src/services';

function post(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.STORAGE_BACKEND = 'memory';
  __resetEnv();
  __resetRepositories();
  __resetServices();
});

afterEach(() => {
  __resetEnv();
  __resetRepositories();
  __resetServices();
});

describe('POST /api/contact', () => {
  it("accepts the website's `brand` value and stores it as a client inquiry", async () => {
    const res = await contact(
      post('http://localhost/api/contact', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '(555) 123-4567',
        company: 'Doe Realty',
        interestType: 'brand',
        message: 'We need customers.',
        consent: true,
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.received).toBe(true);

    const [inquiry] = await getRepositories().inquiries.list();
    // The website says "brand"; the domain says "client". The translation happens at the
    // boundary so the wrong word never reaches the core model.
    expect(inquiry?.interestType).toBe('client');
    expect(inquiry?.consentGranted).toBe(true);
    expect(inquiry?.consentWording).toContain('I agree to be contacted');
    expect(inquiry?.consentIp).toBe('203.0.113.9');
    // Consent is no longer smuggled into the message body.
    expect(inquiry?.message).toBe('We need customers.');
  });

  it('also accepts the corrected `client` value', async () => {
    const res = await contact(
      post('http://localhost/api/contact', {
        name: 'Jane',
        email: 'jane@example.com',
        interestType: 'client',
        consent: true,
      }),
    );
    expect(res.status).toBe(201);
    expect((await getRepositories().inquiries.list())[0]?.interestType).toBe('client');
  });

  it('refuses a submission without consent', async () => {
    const res = await contact(
      post('http://localhost/api/contact', {
        name: 'Jane',
        email: 'jane@example.com',
        consent: false,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(await getRepositories().inquiries.list()).toHaveLength(0);
  });

  it('accepts the honeypot silently and stores nothing', async () => {
    const res = await contact(
      post('http://localhost/api/contact', {
        name: 'Bot',
        email: 'bot@example.com',
        consent: true,
        hp: 'spam',
      }),
    );
    // 200 with no id: indistinguishable from success to a bot, but nothing is written.
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBeUndefined();
    expect(await getRepositories().inquiries.list()).toHaveLength(0);
  });

  /**
   * Regression: `website` was the honeypot's name until the site grew a visible Website
   * input. If the two are ever confused again, every genuine submission carrying a website
   * is silently discarded while the visitor is told the message was received.
   */
  it('treats a submitted website as real information, not as a bot signal', async () => {
    const res = await contact(
      post('http://localhost/api/contact', {
        name: 'Real Person',
        email: 'real@example.com',
        consent: true,
        website: 'https://example.com',
        message: 'Looking to build a buyer acquisition system.',
      }),
    );
    expect(res.status).toBe(201);

    const stored = await getRepositories().inquiries.list();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.message).toContain('https://example.com');
    expect(stored[0]?.message).toContain('Looking to build a buyer acquisition system.');
  });
});

describe('POST /api/become-a-partner', () => {
  it('records an application as a publisher inquiry, not a Publisher row', async () => {
    const res = await becomeAPartner(
      post('http://localhost/api/become-a-partner', {
        name: 'Pat Partner',
        email: 'pat@example.com',
        audienceType: 'seo',
        audienceSize: '20k/mo',
        promoDescription: 'Real estate blog, organic search.',
        consent: true,
      }),
    );

    expect(res.status).toBe(201);
    const repos = getRepositories();
    const [inquiry] = await repos.inquiries.list();
    expect(inquiry?.interestType).toBe('publisher');
    expect(inquiry?.message).toContain('SEO / organic');
    expect(inquiry?.message).toContain('Real estate blog');
    expect(inquiry?.consentGranted).toBe(true);

    // Creating a Publisher here would strand applications with no admin screen to review
    // them, so the route deliberately does not.
    expect(await repos.publishers.list()).toHaveLength(0);
    // And an application is emphatically not a consumer lead.
    expect(await repos.leads.list()).toHaveLength(0);
  });

  it('requires a promotion description', async () => {
    const res = await becomeAPartner(
      post('http://localhost/api/become-a-partner', {
        name: 'Pat',
        email: 'pat@example.com',
        promoDescription: '',
        consent: true,
      }),
    );
    expect(res.status).toBe(400);
  });
});

/**
 * Email routing, through the real route handlers.
 *
 * No recipient variables are set here, so this runs against the environment DEFAULTS — the
 * values production uses when nobody has overridden them. If these pass, a deploy with only
 * the provider key and sender configured routes each form to the right inbox.
 */
describe('form email routing', () => {
  const ROUTING_KEYS = [
    'EMAIL_PROVIDER_API_KEY',
    'EMAIL_FROM',
    'CONTACT_INQUIRY_EMAIL',
    'PUBLISHER_INQUIRY_EMAIL',
    'ADMIN_NOTIFY_EMAIL',
    'EMAIL_API_ENDPOINT',
  ] as const;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    for (const key of ROUTING_KEYS) delete process.env[key];
    process.env.EMAIL_PROVIDER_API_KEY = 'test-key';
    process.env.EMAIL_FROM = 'site@reylixinc.com';
    __resetEnv();
    __resetServices();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    for (const key of ROUTING_KEYS) delete process.env[key];
    vi.unstubAllGlobals();
  });

  /** Every address the email provider was asked to deliver to, across all sends. */
  function recipients(): string[] {
    return fetchMock.mock.calls.flatMap((call) => {
      const [, init] = call as [string, { body: string }];
      return (JSON.parse(init.body) as { to: string[] }).to;
    });
  }

  const contactPayload = {
    name: 'Cara Contact',
    email: 'cara@example.com',
    interestType: 'brand',
    message: 'We need customers.',
    consent: true,
  };

  const partnerPayload = {
    name: 'Pat Partner',
    email: 'pat@example.com',
    promoDescription: 'SEO traffic in legal.',
    consent: true,
  };

  it('Contact form -> info@reylixinc.com', async () => {
    const res = await contact(post('http://localhost/api/contact', contactPayload));
    expect(res.status).toBe(201);
    expect(recipients()).toEqual(['info@reylixinc.com']);
  });

  it('Publisher / partner form -> publishers@reylixinc.com', async () => {
    const res = await becomeAPartner(post('http://localhost/api/become-a-partner', partnerPayload));
    expect(res.status).toBe(201);
    expect(recipients()).toEqual(['publishers@reylixinc.com']);
  });

  it('the two recipients cannot be swapped: each form reaches only its own inbox', async () => {
    await contact(post('http://localhost/api/contact', contactPayload));
    const fromContact = recipients();
    fetchMock.mockClear();
    await becomeAPartner(post('http://localhost/api/become-a-partner', partnerPayload));
    const fromPartner = recipients();

    expect(fromContact).not.toContain('publishers@reylixinc.com');
    expect(fromPartner).not.toContain('info@reylixinc.com');
    expect(fromContact).not.toEqual(fromPartner);
  });

  /**
   * The contact API accepts `interestType: 'publisher'`. Routing on that field would send a
   * contact enquiry to the publisher inbox, which is exactly what must not happen: routing
   * follows the endpoint, not the payload.
   */
  it('a contact submission claiming to be a publisher still goes to info@reylixinc.com', async () => {
    const res = await contact(
      post('http://localhost/api/contact', { ...contactPayload, interestType: 'publisher' }),
    );
    expect(res.status).toBe(201);
    expect(recipients()).toEqual(['info@reylixinc.com']);
  });

  it('honours the environment overrides when they are set', async () => {
    process.env.CONTACT_INQUIRY_EMAIL = 'contact-override@example.com';
    process.env.PUBLISHER_INQUIRY_EMAIL = 'partner-override@example.com';
    __resetEnv();
    __resetServices();

    await contact(post('http://localhost/api/contact', contactPayload));
    await becomeAPartner(post('http://localhost/api/become-a-partner', partnerPayload));

    expect(recipients()).toEqual(['contact-override@example.com', 'partner-override@example.com']);
  });

  it('a honeypot hit sends no email to either inbox', async () => {
    await contact(post('http://localhost/api/contact', { ...contactPayload, hp: 'bot' }));
    await becomeAPartner(post('http://localhost/api/become-a-partner', { ...partnerPayload, hp: 'bot' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a submission that fails validation sends no email', async () => {
    await contact(post('http://localhost/api/contact', { ...contactPayload, consent: false }));
    await becomeAPartner(
      post('http://localhost/api/become-a-partner', { ...partnerPayload, promoDescription: '' }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
