# Production launch — required configuration

Everything the public marketing site needs before it is safe to point traffic at.
Names only. Never paste a value into this file, a ticket, or a chat.

---

## 1. The one blocker: submissions are not stored

`STORAGE_BACKEND` currently resolves to `memory` in production — confirmed live at
`/api/healthz`. The memory adapter is a process-local object.

**What that means today:** a visitor submits the contact or partner form, the API returns
`201`, the browser shows "Message received", and the record exists only in that serverless
invocation's memory. When the function is recycled — which on Vercel can be seconds later —
the enquiry is gone. The only trace is a `console.info` line in the platform log.

For a company whose entire site exists to capture enquiries, that is a launch blocker, not a
configuration nicety. Two ways to close it:

1. **Provision Supabase** and set `STORAGE_BACKEND=supabase` with the three keys below.
   `docs/supabase-setup.md` is the procedure. Nothing in `supabase/migrations/` has ever been
   executed, so the first run is also the first verification.
2. **Or wire an email notifier** as an interim, so an enquiry at least reaches a human inbox.
   `LoggingAdminNotifier` in `src/services/notifications.ts` is the drop-in point; the
   `AdminNotifier` interface already exists and the services already call it.

Until one of those is done, the honest description is: the forms work, and nothing keeps what
they collect.

---

## 2. Environment variables

Set these in the hosting dashboard, per environment.

### Required before launch

| Variable | Why | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, every canonical URL, Open Graph, sitemap, robots | **Must be set at BUILD time**, not just runtime — `NEXT_PUBLIC_*` is inlined during the build. Without it the site falls back to the Vercel host, which is correct but not the brand domain. |

### Required only when `STORAGE_BACKEND=supabase`

| Variable | Exposure |
|---|---|
| `STORAGE_BACKEND` | Set to `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only. Bypasses every RLS policy. Never `NEXT_PUBLIC_`.** |

### Optional

`ADMIN_EMAILS`, `ADMIN_PASSWORD`, `EMAIL_PROVIDER_API_KEY`, `ADMIN_NOTIFY_EMAIL`,
`REDIRECT_COOKIE_DOMAIN`, `REDIRECT_BASE_URL`, `ATTRIBUTION_WINDOW_DAYS`,
`CLICK_DEDUP_MINUTES`, `ALLOWED_REDIRECT_HOSTS`.

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

1. Update `app/(marketing)/privacy/page.tsx` — it currently states there are no analytics and
   no third-party trackers. That sentence becomes false the moment GA4 loads.
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
- **The homepage has no proof section.** `CLIENT_SYSTEM` in `app/(marketing)/page.tsx` is a
  reserved slot awaiting the URL and screenshots of a real client system.
- **Business identity is undecided and deliberately unstated:** production domain, publishable
  contact email, business address, and state of incorporation. Nothing invents them.
