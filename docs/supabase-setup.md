# Supabase setup — Step 3A

Everything needed to connect Reylix to a real Supabase environment.

> **Never paste keys into a chat, a ticket, or a commit.** Every secret below goes
> straight from the Supabase dashboard into `.env.local` (local) or the Vercel dashboard
> (deployed). Nothing in this repository should ever contain a real key — `.env.local` is
> already gitignored.

---

## Part 1 — What you must do manually

These require your Supabase and Vercel accounts. They cannot be automated from here.

### 1.1 Create two projects

Two, not one. A preview deployment pointed at production data is how test leads end up in
a real payout run.

| Project | Name suggestion | Purpose |
|---|---|---|
| Staging | `reylix-staging` | Preview deploys, RLS verification, contract tests. **Disposable — tests write real rows.** |
| Production | `reylix-production` | Live data. Nothing experimental ever runs here. |

For each: choose a region close to your users (US East for a US launch), and save the
database password in a password manager — Supabase shows it once.

### 1.2 Collect the keys

For each project: **Project Settings → API**.

| Value | Where it appears | Exposure |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Public — safe in the browser |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — RLS applies to it |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` | **Server only. Bypasses every RLS policy.** |

> If the service-role key is ever exposed, rotating it in Supabase is the only remedy.
> It must never carry a `NEXT_PUBLIC_` prefix — that prefix inlines the value into the
> JavaScript bundle sent to every visitor.

### 1.3 Configure Auth

**Authentication → Providers → Email**

- Enable Email provider.
- **Disable "Enable sign-ups".** Portal access requires an ACTIVE publisher record, and a
  self-service signup would create an auth user with no publisher row and no status —
  exactly the state the access rules exist to prevent. Publishers are invited.
- Enable "Confirm email".

**Authentication → URL Configuration**

- Site URL: your production domain (or the Vercel production URL until the domain exists).
- Redirect URLs: add the Vercel preview wildcard and `http://localhost:3000/**`.

### 1.4 Apply the migrations

**SQL Editor → New query**, then paste and run each file in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_step2_domain.sql`
3. `supabase/migrations/0003_offer_optional_hierarchy.sql`

Run them **one at a time** and read the result of each. They have never been executed
against a real Postgres instance, so the first run is also the first verification.

If you prefer the CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 1.5 Seed the admin allow-list

RLS checks `public.admin_users`, not the `ADMIN_EMAILS` environment variable. An address
in the env var alone is **not** an admin at the database level.

```sql
insert into public.admin_users (email) values ('you@yourdomain.com');
```

### 1.6 Create the first publisher and invite them

Do this on **staging only** for now.

1. **Authentication → Users → Invite user** with a test address. Copy the resulting user
   UUID.
2. Insert a matching publisher row and link it:

```sql
insert into public.publishers
  (auth_user_id, publisher_code, full_name, email, phone, status)
values
  ('PASTE-AUTH-USER-UUID', 'TEST1', 'Test Publisher',
   'test@yourdomain.com', '+15551234567', 'active');
```

The `auth_user_id` link is what `public.current_publisher_id()` resolves, and it is what
every RLS policy depends on. A publisher without it can sign in and see nothing.

### 1.7 Vercel environment variables

**Project → Settings → Environment Variables.** Set each value for the correct scope —
this separation is the whole point of having two projects.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `STORAGE_BACKEND` | `supabase` | `supabase` | `memory` |
| `NEXT_PUBLIC_SUPABASE_URL` | production | staging | staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production | staging | staging |
| `SUPABASE_SERVICE_ROLE_KEY` | production | staging | staging |
| `NEXT_PUBLIC_SITE_URL` | real domain | Vercel preview URL | `http://localhost:3000` |
| `ADMIN_EMAILS` | your address | your address | your address |

---

## Part 2 — Local development

```bash
cp .env.example .env.local
```

Fill in the **staging** values only. Never point local development at production.

```bash
STORAGE_BACKEND=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-STAGING-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

To work without any Supabase connection at all, leave `STORAGE_BACKEND=memory`. The whole
application still runs; nothing persists between restarts.

---

## Part 3 — What I can run once the project exists

Nothing below needs your credentials in chat — each reads `.env.local`.

### 3.1 Verify the adapter against the live database

```bash
RUN_SUPABASE_CONTRACT=1 npm test
```

Runs the shared contract test against the Supabase adapter as well as memory. **Point this
at staging only — it writes real rows.**

### 3.2 Verify RLS at the database level

```bash
RUN_SUPABASE_RLS=1 npm test -- rls
```

This is the suite that proves the security claims rather than inspecting the SQL. It
requires two test publishers, each with a linked auth user, and the credentials named in
`.env.local` (see `tests/integration/rls.test.ts` for the exact variables). It asserts, with
real connections and the anon key:

- Publisher A cannot read or modify Publisher B's leads.
- Publisher A cannot read Publisher B's referral links or commissions.
- No publisher can read the `clients` table at all.
- An unauthenticated (anon, no session) client can read nothing.
- Admin access still resolves through `public.is_admin()`.

Until this passes, RLS is **intended, not enforced** — that is the honest description of
its current state.

### 3.3 Deploy

Once `npm run build` passes locally with `STORAGE_BACKEND=supabase`, deploy a preview and
confirm `/api/healthz` reports `storageBackend: "supabase"`.

---

## Ordering

```
1.1 create projects
      ↓
1.2 collect keys ──► 1.7 Vercel vars
      ↓                    │
1.3 configure Auth         │
      ↓                    │
1.4 apply migrations       │
      ↓                    │
1.5 seed admin_users       │
      ↓                    │
1.6 create test publisher  │
      ↓                    ▼
2.  .env.local  ────► 3.1 contract test
                      3.2 RLS verification
                      3.3 deploy
```

Steps 1.4 and 1.5 must happen before 1.6: the publisher insert references tables the
migrations create, and the admin check reads a table `0001` defines.
