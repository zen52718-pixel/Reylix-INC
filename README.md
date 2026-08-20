# Reylix INC

US customer-acquisition platform. Reylix builds and owns products, and runs a publisher
channel that connects US advertisers with customers.

Two managed sides:

- **Buyers** — advertisers who pay for approved leads. **Admin-managed in v1**: no buyer
  login, no self-serve portal. A buyer-facing role is a later phase.
- **Publishers** — affiliates who submit or drive leads and earn commission. Self-serve portal.

Lead lifecycle: publisher submits or drives a lead → admin reviews → **approve** (admin
enters the commission) or **reject** (reason required) → commission → payout. Payouts are
tracked in-app and paid out of band (ACH/PayPal/check) in v1.

## Architecture

The storage backend is the only thing that changes when the database changes.

```
app/            Next.js 14 App Router (routes + UI)
src/domain/     Storage-agnostic models. Imports nothing but itself.
src/services/   ALL business logic. Depends ONLY on repository interfaces.
src/repositories/
  interfaces.ts   The contract every backend must satisfy
  memory/         In-memory adapter (dev + tests)
  supabase/       Supabase/Postgres adapter (staging + production)
  index.ts        Factory bound to STORAGE_BACKEND
supabase/schema.sql  Tables, indexes, constraints, and RLS policies
```

Two rules hold the design together, and both are **enforced, not just documented**:

1. **Import boundary.** `src/domain` and `src/services` may never import a concrete
   adapter or a storage SDK. ESLint fails the build if they do — verified by deliberately
   introducing a violation, not just by writing the rule.
2. **Shared contract test.** `tests/unit/repositories/contract.test.ts` is one behavioural
   suite run against *every* adapter. Adapters that pass it are interchangeable, which is
   what makes flipping `STORAGE_BACKEND` safe.

## Getting started

```bash
npm install
cp .env.example .env.local   # defaults run entirely in-memory
npm run dev
```

No configuration is needed for local development: `STORAGE_BACKEND=memory` boots with
zero secrets.

### Quality gates

All four must be green before anything ships:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor (or `supabase db execute --file supabase/schema.sql`).
3. Insert your admin address into `public.admin_users` — RLS checks that table, so an
   address in `ADMIN_EMAILS` alone is not yet an admin at the database level.
4. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`, then set `STORAGE_BACKEND=supabase`.

The service-role key bypasses RLS and is server-only. It must never be prefixed with
`NEXT_PUBLIC_`. RLS is what protects the data from anything holding only the anon key.

To run the contract test against a live database as well as memory, point the Supabase
variables at a **disposable** project and set `RUN_SUPABASE_CONTRACT=1`. The suite writes
real rows.

## Sprint status

| # | Sprint | State |
|---|--------|-------|
| 0 | Foundation: architecture, adapters, schema + RLS, quality gates | **Done** |
| 1 | Supabase adapter hardening + Supabase Auth | Next |
| 2 | Publisher portal | Not started |
| 3 | Admin portal (buyers, publishers, offers, leads, payouts, audit) | Not started |
| 4 | Marketing site + public forms | Not started |
| 5 | Hardening: RLS review, security pass, deploy | Not started |

## Open decisions

- **Domain** is not yet chosen; `reylix.com` is a placeholder in `.env.example` and in the
  redirect defaults.
- **Brand palette** in `tailwind.config.ts` is a proposal (deep blue for trust, emerald
  reserved for money states), not a signed-off identity.
- **Verticals** for the US launch are undecided. They affect TCPA consent wording on lead
  and contact forms.

## Provenance

The architecture is forked from a prior product of the same shape. Reused: domain models,
service layer, repository interfaces, the memory adapter, and the test suite. Replaced:
Google Sheets storage → Supabase; PKR → USD; bilingual Urdu/RTL → en-US; `Partner` →
`Publisher`. The `Buyer` entity is new here and has no equivalent in the original.
