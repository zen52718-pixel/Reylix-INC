# Production launch — required configuration

Everything the public marketing site needs before it is safe to point traffic at.
Names only. Never paste a value into this file, a ticket, or a chat.

---

## 1. Submissions: email is currently the system of record

`STORAGE_BACKEND` resolves to `memory` in production — confirmed live at `/api/healthz`. The
memory adapter is a process-local object. Hostinger runs a long-lived Node process rather
than serverless functions, so a submission survives in RAM until the process restarts — and
every redeploy restarts it. Nothing is written to disk.

**The interim fix is wired and shipping: an email notifier.** When it is configured, every
submission is emailed before the request returns, consent record included. Until Supabase
exists, that email is the only durable copy.

### Routing

Each form is delivered to its own inbox, decided by the **endpoint that received it** — never
by anything in the submitted payload:

| Form | Endpoint | Delivered to | Override with |
|---|---|---|---|
| Contact | `/api/contact` | `info@reylixinc.com` | `CONTACT_INQUIRY_EMAIL` |
| Become a Partner | `/api/become-a-partner` | `publishers@reylixinc.com` | `PUBLISHER_INQUIRY_EMAIL` |

Both addresses are the environment **defaults**, so no recipient configuration is needed. The
contact API accepts `interestType: 'publisher'`; routing deliberately ignores that field, so a
contact enquiry can never reach the publisher inbox. `tests/unit/routes/public-forms.test.ts`
proves the routing through the real route handlers, and fails if the two are swapped.

### Turning it on

Production runs on **Hostinger**, not Vercel: reylixinc.com answers with `platform: hostinger`
and the API routes execute there. Set these in **hPanel -> Node.js -> Environment Variables**,
then redeploy.

Mail is sent over **Hostinger SMTP**. No DNS work is needed: the domain's zone already
authorises Hostinger to send for it (`v=spf1 include:_spf.mail.hostinger.com` plus three
`hostingermail-*._domainkey` DKIM CNAMEs), and both recipients are Hostinger mailboxes, so the
mail never leaves their network.

| Variable | Notes |
|---|---|
| `SMTP_USER` | The sending mailbox, e.g. `noreply@reylixinc.com`. Must be a real mailbox. |
| `SMTP_PASSWORD` | That mailbox's password. **Server-only, and it also grants read access to the mailbox** — use a dedicated sending mailbox, not a person's. |
| `SMTP_HOST` / `SMTP_PORT` | Default to `smtp.hostinger.com` / `465`. Leave unset unless overriding. |
| `EMAIL_FROM` | Optional; defaults to `SMTP_USER`. It must be the authenticated mailbox, or the server rejects the envelope. |

Set `NEXT_PUBLIC_SITE_URL=https://reylixinc.com` at the same time. It is read at BUILD time, so
it needs a redeploy, not just a save — without it canonical URLs, Open Graph and the sitemap
all point at `http://localhost:3000`.

**Resend remains supported** and needs no code change: set `EMAIL_PROVIDER_API_KEY` and
`EMAIL_FROM` and leave the SMTP variables blank. SMTP wins when both are configured. Resend
would first need its own DNS records on a `send.` subdomain — the root SPF and Hostinger's
DKIM must not be edited for it.

With neither configured, the site falls back to the logging notifier: no errors, no delivery.
`/api/healthz` does not report notifier state.

### What it guarantees, and what it does not

- **The send is awaited**, never fire-and-forget. This matters most on serverless hosts,
  where a function can be frozen the instant its response is returned; on the long-lived
  Hostinger process it also guarantees a failure is logged before the request ends. A
  regression test fails if anyone reverts it.
- **A failed send never breaks the visitor's submission.** They filled the form correctly;
  they get the success state.
- **A failed send is recoverable.** After one retry, the notifier writes the complete record
  to the platform log as `admin_notify_failed` with `"recoverable": true`. Grep for that
  string to find anything that did not get delivered.
- **A hung mail server cannot stall a form.** Every SMTP timeout is set to 10s, and a 5xx
  reply (bad credentials, rejected sender) is treated as permanent and not retried.
- **It is still not a database.** There is no list, no search, no history, no deduplication —
  just an inbox. Supabase remains the real answer; `docs/supabase-setup.md` is the procedure.
  No migration in `supabase/migrations/` has ever been executed.

## 2. Environment variables

Set these in the hosting dashboard, per environment.

### Required before launch

| Variable | Why | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, every canonical URL, Open Graph, sitemap, robots | **Must be set at BUILD time**, not just runtime — `NEXT_PUBLIC_*` is inlined during the build. On Hostinger there is no host to fall back to, so without it every canonical URL, Open Graph tag and sitemap entry says `http://localhost:3000`. Verified live on 2026-09-17. |

### Required for form delivery (see section 1)

`SMTP_USER` and `SMTP_PASSWORD` (Hostinger SMTP), or `EMAIL_PROVIDER_API_KEY` and `EMAIL_FROM`
(Resend) — a complete set, or neither takes effect. Recipients default
to `info@reylixinc.com` (contact) and `publishers@reylixinc.com` (partner); override with
`CONTACT_INQUIRY_EMAIL` / `PUBLISHER_INQUIRY_EMAIL` only if needed.

### Required only when `STORAGE_BACKEND=supabase`

| Variable | Exposure |
|---|---|
| `STORAGE_BACKEND` | Set to `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only. Bypasses every RLS policy. Never `NEXT_PUBLIC_`.** |

### Optional

`ADMIN_EMAILS`, `ADMIN_PASSWORD`, `REDIRECT_COOKIE_DOMAIN`, `REDIRECT_BASE_URL`,
`ATTRIBUTION_WINDOW_DAYS`, `CLICK_DEDUP_MINUTES`, `ALLOWED_REDIRECT_HOSTS`.

> **Empty values are safe now.** A present-but-empty variable is treated as unset. It was not
> always: one empty variable used to make `loadEnv()` throw, which returned HTTP 500 from both
> public forms while `/api/healthz` stayed green because it deliberately avoids that function.
> That is what happened in production. `tests/unit/config/env.test.ts` locks the behaviour.

---

## 3. Analytics — not installed, deliberately

The site currently loads **no** analytics, no tag manager and no third-party pixel. That is
worth knowing rather than assuming: the privacy page states it as fact, so installing
something silently would make that page untrue.

**Recommended for production:**

- **Google Analytics 4** — traffic and conversion measurement
- **Google Search Console** — index coverage, queries, Core Web Vitals

**Exact integration points:**

| What | Where |
|---|---|
| GA4 script | `app/layout.tsx`, inside `<body>`, using `next/script` with `strategy="afterInteractive"` |
| Search Console verification | `app/layout.tsx` → `metadata.verification.google`, or a DNS TXT record |
| Conversion events | `components/marketing/ContactForm.tsx` and `PartnerForm.tsx`, in the `status === 'sent'` branch |

Two things to do at the same time, or not at all:

1. Re-read `app/(marketing)/privacy/page.tsx`. It now says the site *may* use cookies and
   third-party analytics, which stays true either way — but "may" is doing a lot of work, and
   once GA4 is actually running the honest version names it.
2. Decide whether a consent banner is required for the audience. GA4 in the US is generally
   handled by disclosure; the EU is a different answer.

No measurement ID is invented here. Supply the real one when you have it.

---

## 4. Still outstanding

- **Privacy policy and terms are explicit placeholders**, and the site collects names, emails,
  phone numbers, IP addresses and TCPA-style consent through two live forms. That combination
  needs counsel before launch. Both pages say so plainly and are `noindex`.
- ~~No Open Graph image.~~ **Shipped.** `app/opengraph-image.png` is a real 1200×630 asset, and
  Next's file convention emits both `og:image` and `twitter:image` from it.
- ~~No `apple-touch-icon`.~~ **Shipped.** `app/apple-icon.png` is 180×180 and full-bleed, with no
  transparency and no pre-rounded corners, because iOS applies its own mask.
- **The site shows no proof.** No metrics, testimonials, client logos or case studies exist,
  and none are invented. The design handoff has no slot for them either, so adding one is a
  design decision as well as a content one — worth making once a real client system can be
  pointed at.
- **Business identity:** address and both public inboxes are published (see
  `components/marketing/content.ts`). The production domain is live. Still unstated: the state
  of incorporation and any public phone number — nothing invents them.
