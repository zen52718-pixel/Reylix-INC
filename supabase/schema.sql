-- =============================================================================
-- Reylix INC — Supabase (Postgres) schema + Row Level Security
--
-- Apply with:  supabase db execute --file supabase/schema.sql
--          or: paste into the Supabase SQL editor
--
-- Design notes
--  * UUID primary keys, timestamptz everywhere, money as numeric(12,2) in USD.
--  * Status columns are CHECK-constrained to exactly the values in
--    src/domain/types.ts. If you add a status there, add it here in the same commit.
--  * RLS is ON for every table. The application's server routes use the service-role
--    key and therefore bypass RLS by design; these policies are what protects the data
--    from anything holding only the anon key (the browser, a leaked publishable key).
--  * A publisher can read only their own rows. Admin is an allow-list, not a guess.
-- =============================================================================

create extension if not exists pgcrypto;

-- ─── admin allow-list ────────────────────────────────────────────────────────
-- Admin is membership in this table, checked by email against the JWT. Keeping it in
-- the database (rather than only in an env var) means RLS can enforce it too, not just
-- the application layer.
create table if not exists public.admin_users (
  email       text primary key,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ─── buyers (advertisers) — admin-managed in v1, no buyer login ──────────────
create table if not exists public.buyers (
  id             uuid primary key default gen_random_uuid(),
  company        text        not null,
  contact_name   text        not null,
  contact_email  text        not null,
  contact_phone  text,
  status         text        not null default 'active'
                             check (status in ('active','paused','archived')),
  notes          text,
  created_at     timestamptz not null default now()
);

create unique index if not exists buyers_company_key on public.buyers (lower(company));
create index if not exists buyers_status_idx on public.buyers (status);

-- ─── publishers (affiliates) — self-serve portal, one Supabase Auth user each ─
create table if not exists public.publishers (
  id                uuid primary key default gen_random_uuid(),
  auth_user_id      uuid unique references auth.users (id) on delete set null,
  publisher_code    text        not null,
  full_name         text        not null,
  email             text        not null,
  phone             text        not null,
  country           text,
  city              text,
  audience_type     text,
  promo_description text,
  payout_method     text check (payout_method in ('ach','paypal','check','other')),
  payout_details    text,
  status            text        not null default 'pending'
                                check (status in ('pending','active','suspended')),
  created_at        timestamptz not null default now(),
  approved_at       timestamptz
);

-- Codes and emails are matched case-insensitively by the application, so uniqueness
-- must be case-insensitive too or the app and the database disagree.
create unique index if not exists publishers_code_key on public.publishers (upper(publisher_code));
create unique index if not exists publishers_email_key on public.publishers (lower(email));
create index if not exists publishers_status_idx on public.publishers (status);

-- ─── offers / campaigns — always owned by exactly one buyer ──────────────────
create table if not exists public.offers (
  id                uuid primary key default gen_random_uuid(),
  buyer_id          uuid        not null references public.buyers (id) on delete restrict,
  offer_code        text        not null,
  name              text        not null,
  category          text,
  description       text,
  destination_url   text        not null,
  commission_amount numeric(12,2) not null default 0 check (commission_amount >= 0),
  currency          text        not null default 'USD',
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now()
);

create unique index if not exists offers_code_key on public.offers (upper(offer_code));
create index if not exists offers_buyer_idx on public.offers (buyer_id);
create index if not exists offers_active_idx on public.offers (is_active) where is_active;

-- ─── referral links — deterministic {PUBLISHERCODE}-{OFFERCODE} ──────────────
create table if not exists public.referral_links (
  id           uuid primary key default gen_random_uuid(),
  publisher_id uuid        not null references public.publishers (id) on delete cascade,
  offer_id     uuid        not null references public.offers (id) on delete cascade,
  ref_code     text        not null,
  created_at   timestamptz not null default now()
);

create unique index if not exists referral_links_code_key on public.referral_links (upper(ref_code));
create unique index if not exists referral_links_pub_offer_key
  on public.referral_links (publisher_id, offer_id);

-- ─── clicks — append-only tracking events ───────────────────────────────────
create table if not exists public.clicks (
  id           uuid primary key default gen_random_uuid(),
  ref_code     text        not null,
  publisher_id uuid        not null references public.publishers (id) on delete cascade,
  offer_id     uuid        not null references public.offers (id) on delete cascade,
  clicked_at   timestamptz not null default now(),
  country      text,
  device_type  text,
  user_agent   text,
  dedup_key    text        not null,
  is_unique    boolean     not null default true
);

create index if not exists clicks_publisher_time_idx on public.clicks (publisher_id, clicked_at desc);
-- Supports the dedup probe, which is (dedup_key = ? and clicked_at >= ?).
create index if not exists clicks_dedup_idx on public.clicks (dedup_key, clicked_at desc);

-- ─── leads — the core record; commission is set by an admin at approval ─────
create table if not exists public.leads (
  id                          uuid primary key default gen_random_uuid(),
  publisher_id                uuid references public.publishers (id) on delete set null,
  offer_id                    uuid references public.offers (id) on delete set null,
  buyer_id                    uuid references public.buyers (id) on delete set null,
  ref_code                    text,
  attribution_source          text        not null default 'none'
                                          check (attribution_source in ('param','cookie','manual','none')),
  status                      text        not null default 'new'
                                          check (status in ('new','approved','rejected','paid')),
  commission_amount           numeric(12,2) not null default 0 check (commission_amount >= 0),
  captured_data               jsonb       not null default '{}'::jsonb,
  customer_name               text,
  customer_phone              text,
  created_at                  timestamptz not null default now(),
  approved_at                 timestamptz,
  paid_at                     timestamptz,
  reject_reason               text,
  commission_override_enabled boolean     not null default false,
  commission_override_amount  numeric(12,2) default 0,

  -- The two business rules that must never be violated, enforced by the database and
  -- not only by CommissionService: a rejected lead carries a reason, and an approved
  -- lead carries an approval timestamp.
  constraint leads_reject_reason_required
    check (status <> 'rejected' or (reject_reason is not null and length(btrim(reject_reason)) > 0)),
  constraint leads_approved_at_required
    check (status not in ('approved','paid') or approved_at is not null)
);

create index if not exists leads_publisher_idx on public.leads (publisher_id, created_at desc);
create index if not exists leads_buyer_idx on public.leads (buyer_id, created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- ─── payouts — one row per (publisher, period), generated then marked paid ───
create table if not exists public.payouts (
  id               uuid primary key default gen_random_uuid(),
  publisher_id     uuid        not null references public.publishers (id) on delete cascade,
  period_label     text        not null,
  lead_count       integer     not null default 0 check (lead_count >= 0),
  total_commission numeric(12,2) not null default 0 check (total_commission >= 0),
  status           text        not null default 'pending' check (status in ('pending','paid')),
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);

-- Required by the adapter's upsert(onConflict: publisher_id,period_label): it is what
-- makes regenerating a period idempotent rather than duplicating rows.
create unique index if not exists payouts_publisher_period_key
  on public.payouts (publisher_id, period_label);
create index if not exists payouts_status_idx on public.payouts (status);

-- ─── audit — append-only trail of privileged actions ────────────────────────
create table if not exists public.audit (
  id          uuid primary key default gen_random_uuid(),
  actor       text        not null,
  entity      text        not null,
  entity_id   text        not null,
  action      text        not null,
  detail      jsonb       not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists audit_entity_idx on public.audit (entity, entity_id);
create index if not exists audit_time_idx on public.audit (occurred_at desc);

-- ─── contacts — public enquiries from the marketing site ────────────────────
create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  email         text        not null,
  phone         text,
  company       text,
  interest_type text        not null default 'other'
                            check (interest_type in ('brand','publisher','other')),
  message       text,
  handled       boolean     not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists contacts_handled_idx on public.contacts (handled, created_at desc);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- The publisher row belonging to the current Supabase Auth user, or NULL.
create or replace function public.current_publisher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.publishers p where p.auth_user_id = auth.uid() limit 1;
$$;

alter table public.admin_users    enable row level security;
alter table public.buyers         enable row level security;
alter table public.publishers     enable row level security;
alter table public.offers         enable row level security;
alter table public.referral_links enable row level security;
alter table public.clicks         enable row level security;
alter table public.leads          enable row level security;
alter table public.payouts        enable row level security;
alter table public.audit          enable row level security;
alter table public.contacts       enable row level security;

-- admin_users: readable only by admins; membership is changed out-of-band.
drop policy if exists admin_users_admin_read on public.admin_users;
create policy admin_users_admin_read on public.admin_users
  for select using (public.is_admin());

-- buyers: admin-only in every direction. Buyers have no login in v1.
drop policy if exists buyers_admin_all on public.buyers;
create policy buyers_admin_all on public.buyers
  for all using (public.is_admin()) with check (public.is_admin());

-- publishers: a publisher sees and edits only their own row; admin sees all.
drop policy if exists publishers_admin_all on public.publishers;
create policy publishers_admin_all on public.publishers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists publishers_self_read on public.publishers;
create policy publishers_self_read on public.publishers
  for select using (auth_user_id = auth.uid());

-- Self-service edits are limited to the row itself. Which COLUMNS may change
-- (never status, code, or email) is enforced by PublisherPortalService's allow-list.
drop policy if exists publishers_self_update on public.publishers;
create policy publishers_self_update on public.publishers
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- offers: any signed-in publisher may read ACTIVE offers (they promote them);
-- only admin may read inactive ones or write at all.
drop policy if exists offers_admin_all on public.offers;
create policy offers_admin_all on public.offers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists offers_publisher_read_active on public.offers;
create policy offers_publisher_read_active on public.offers
  for select using (is_active and public.current_publisher_id() is not null);

-- referral_links / clicks / leads / payouts: strictly the caller's own rows.
drop policy if exists referral_links_admin_all on public.referral_links;
create policy referral_links_admin_all on public.referral_links
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists referral_links_self_read on public.referral_links;
create policy referral_links_self_read on public.referral_links
  for select using (publisher_id = public.current_publisher_id());

drop policy if exists clicks_admin_all on public.clicks;
create policy clicks_admin_all on public.clicks
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists clicks_self_read on public.clicks;
create policy clicks_self_read on public.clicks
  for select using (publisher_id = public.current_publisher_id());

drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all using (public.is_admin()) with check (public.is_admin());

-- Read-only for publishers: approval, rejection, and commission are admin decisions,
-- so there is deliberately no publisher INSERT/UPDATE policy on leads.
drop policy if exists leads_self_read on public.leads;
create policy leads_self_read on public.leads
  for select using (publisher_id = public.current_publisher_id());

drop policy if exists payouts_admin_all on public.payouts;
create policy payouts_admin_all on public.payouts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists payouts_self_read on public.payouts;
create policy payouts_self_read on public.payouts
  for select using (publisher_id = public.current_publisher_id());

-- audit + contacts: admin-only. Public form submissions are written server-side with
-- the service-role key, so no anonymous INSERT policy is needed or wanted.
drop policy if exists audit_admin_read on public.audit;
create policy audit_admin_read on public.audit
  for select using (public.is_admin());

drop policy if exists contacts_admin_all on public.contacts;
create policy contacts_admin_all on public.contacts
  for all using (public.is_admin()) with check (public.is_admin());
