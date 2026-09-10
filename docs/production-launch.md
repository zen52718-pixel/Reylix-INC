# Production launch — required configuration

Everything the public marketing site needs before it is safe to point traffic at.
Names only. Never paste a value into this file, a ticket, or a chat.

---

## 1. Submissions: email is currently the system of record

`STORAGE_BACKEND` resolves to `memory` in production — confirmed live at `/api/healthz`. The
memory adapter is a process-local object, so a submission exists only inside the serverless
invocation that received it.

**The interim fix is wired and shipping: an email notifier.** When it is configured, every
contact enquiry and partner application is emailed to `ADMIN_NOTIFY_EMAIL` before the request
returns, consent record included. Until Supabase exists, that email is the only durable copy.

### Turning it on

Set all three in the hosting dashboard. A partial configuration sends nothing — deliberately,
because a half-working email path looks like it is working:

| Variable | Notes |
|---|---|
| `EMAIL_PROVIDER_API_KEY` | A [Resend](https://resend.com) API key |
| `ADMIN_NOTIFY_EMAIL` | Where submissions are delivered |
| `EMAIL_FROM` | A sender Resend has **verified for your domain**. Before a domain is verified, `onboarding@resend.dev` works for testing. |

With none of them set, the site falls back to the logging notifier and behaves exactly as it
did before — no errors, but no delivery either. `/api/healthz` does not report notifier state.

### What it guarantees, and what it does not

- **The send is awaited**, never fire-and-forget. A serverless function can be frozen the
  instant its response is returned, so an un-awaited send is mail that never leaves. A
  regression test fails if anyone reverts that.
- **A failed send never breaks the visitor's submission.** They filled the form correctly;
  they get the success state.
- **A failed send is recoverable.** After one retry, the notifier writes the complete record
  to the platform log as `admin_notify_failed` with `"recoverable": true`. Grep for that
  string to find anything that did not get delivered.
- **It is still not a database.** There is no list, no search, no history, no deduplication —
  just an inbox. Supabase remains the real answer; `docs/supabase-setup.md` is the procedure.
  No migration in `supabase/migrations/` has ever been executed.

## 2. Environment variables

Set these in the hosting dashboard, per environment.

### Required before launch

| Variable | Why | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, every canonical URL, Open Graph, sitemap, robots | **Must be set at BUILD time**, not just runtime — `NEXT_PUBLIC_*` is inlined during the build. Without it the site falls back to the Vercel host, which is correct but not the brand domain. |

### Required for form delivery (see section 1)

`EMAIL_PROVIDER_API_KEY`, `ADMIN_NOTIFY_EMAIL`, `EMAIL_FROM` — all three, or none take effect.

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
- **No Open Graph image.** The OG/Twitter metadata is complete except the image, which needs a
  real 1200×630 asset. Shared links will render as text-only cards until then.
- **No `apple-touch-icon`.** `favicon.ico` and `icon.svg` ship; iOS home-screen bookmarks will
  fall back to a screenshot.
- **The site shows no proof.** No metrics, testimonials, client logos or case studies exist,
  and none are invented. The design handoff has no slot for them either, so adding one is a
  design decision as well as a content one — worth making once a real client system can be
  pointed at.
- **Business identity is undecided and deliberately unstated:** production domain, publishable
  contact email, business address, and state of incorporation. Nothing invents them.
