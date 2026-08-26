-- =============================================================================
-- 0002 — Step 2 domain migration
--
-- Transforms the Sprint 0 schema into the approved Reylix domain model:
--   buyers   -> clients        (the business PURCHASING acquisition)
--   contacts -> inquiries      (inbound enquiries to Reylix itself)
--   audit    -> audit_entries
--   + products, campaigns, lead_attributions, commissions
--
-- The vocabulary correction is the point of this migration: a "Buyer" in the old schema
-- meant an advertiser, while in the approved model a Buyer is a CONSUMER purchasing a
-- property. Leaving both meanings in one schema was not survivable.
--
-- Safe to run as a rename rather than a copy-and-backfill because no Supabase project has
-- been provisioned and no row has ever existed. The history still shows the transition.
--
-- NOT YET VERIFIED — see supabase/migrations/README.md. Nothing in this file has been
-- executed against a real Postgres instance.
-- =============================================================================

begin;

-- ─── 1 · renames ─────────────────────────────────────────────────────────────
alter table if exists public.buyers   rename to clients;
alter table if exists public.contacts rename to inquiries;
alter table if exists public.audit    rename to audit_entries;

alter index if exists buyers_company_key   rename to clients_company_key;
alter index if exists buyers_status_idx    rename to clients_status_idx;
alter index if exists contacts_handled_idx rename to inquiries_handled_idx;
alter index if exists audit_entity_idx     rename to audit_entries_entity_idx;
alter index if exists audit_time_idx       rename to audit_entries_time_idx;

-- ─── 2 · products — reusable, deliberately client-agnostic ───────────────────
-- There is no client_id here and there must never be one: that absence is what lets one
-- product serve many clients without being rebuilt per client.
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text        not null,
  name        text        not null,
  description text,
  status      text        not null default 'planned'
                          check (status in ('planned','in_development','available','retired')),
  created_at  timestamptz not null default now()
);

create unique index if not exists products_slug_key on public.products (lower(slug));
create index if not exists products_status_idx on public.products (status);

-- ─── 3 · campaigns — acquisition programmes within a product ─────────────────
create table if not exists public.campaigns (
  id                        uuid primary key default gen_random_uuid(),
  product_id                uuid        not null references public.products (id) on delete restrict,
  slug                      text        not null,
  name                      text        not null,
  market                    text,
  -- Consumer de-duplication window, in minutes. NULL means "not configured", which
  -- disables de-duplication for this campaign's offers. No default is set here on
  -- purpose: how long two submissions count as one payable lead is a commercial term
  -- that differs per vertical, and guessing it would change what a publisher is paid.
  lead_dedup_window_minutes integer     check (lead_dedup_window_minutes is null
                                               or lead_dedup_window_minutes > 0),
  is_active                 boolean     not null default true,
  created_at                timestamptz not null default now()
);

create unique index if not exists campaigns_product_slug_key
  on public.campaigns (product_id, lower(slug));
create index if not exists campaigns_product_idx on public.campaigns (product_id);

-- ─── 4 · offers — re-parented to campaign, client attaches HERE ──────────────
alter table public.offers add column if not exists campaign_id uuid;
alter table public.offers add column if not exists client_id   uuid;
alter table public.offers add column if not exists commission_model text
  not null default 'flat'
  check (commission_model in ('flat','cpl','cpa','cpq','revshare','custom'));
alter table public.offers add column if not exists lead_dedup_window_minutes integer
  check (lead_dedup_window_minutes is null or lead_dedup_window_minutes > 0);

-- `category` was a loose string standing in for the product; it is now a real relation.
alter table public.offers drop column if exists category;
alter table public.offers drop column if exists buyer_id;

alter table public.offers
  add constraint offers_campaign_id_fkey
  foreign key (campaign_id) references public.campaigns (id) on delete restrict;
alter table public.offers
  add constraint offers_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete restrict;

-- An offer with no campaign has no market context and silently disappears from every
-- campaign-grouped report; an offer with no client delivers leads to nobody.
alter table public.offers alter column campaign_id set not null;
alter table public.offers alter column client_id   set not null;

create index if not exists offers_campaign_idx on public.offers (campaign_id);
create index if not exists offers_client_idx   on public.offers (client_id);

-- ─── 5 · clicks — cite the referral link ─────────────────────────────────────
alter table public.clicks add column if not exists referral_link_id uuid
  references public.referral_links (id) on delete set null;

-- ─── 6 · leads — consumers acquired for a client ─────────────────────────────
alter table public.leads add column if not exists client_id      uuid references public.clients (id)   on delete set null;
alter table public.leads add column if not exists product_id     uuid references public.products (id)  on delete set null;
alter table public.leads add column if not exists campaign_id    uuid references public.campaigns (id) on delete set null;
alter table public.leads add column if not exists customer_email text;
alter table public.leads add column if not exists dedup_key      text;

alter table public.leads drop column if exists buyer_id;
-- Attribution and money both move out of the lead row: LeadAttribution becomes the
-- system of record for credit, Commission for what is owed. Keeping a copy here would
-- create a second source of truth for money.
alter table public.leads drop column if exists attribution_source;
alter table public.leads drop column if exists commission_amount;
alter table public.leads drop column if exists commission_override_enabled;
alter table public.leads drop column if exists commission_override_amount;

create index if not exists leads_client_idx    on public.leads (client_id, created_at desc);
create index if not exists leads_campaign_idx  on public.leads (campaign_id);
create index if not exists leads_dedup_idx     on public.leads (dedup_key, created_at desc);

-- ─── 7 · lead_attributions — who is credited, and why ────────────────────────
create table if not exists public.lead_attributions (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid        not null references public.leads (id)          on delete cascade,
  publisher_id     uuid        not null references public.publishers (id)     on delete restrict,
  offer_id         uuid        not null references public.offers (id)         on delete restrict,
  client_id        uuid        not null references public.clients (id)        on delete restrict,
  referral_link_id uuid                 references public.referral_links (id) on delete set null,
  click_id         uuid                 references public.clicks (id)         on delete set null,
  source           text        not null check (source in ('param','cookie','manual')),
  attributed_at    timestamptz not null default now(),
  attributed_by    text,
  superseded_at    timestamptz,
  reason           text,

  -- A manual attribution is a human decision and must name the human who made it.
  constraint lead_attributions_manual_needs_actor
    check (source <> 'manual' or (attributed_by is not null and length(btrim(attributed_by)) > 0))
);

-- THE rule this table exists to guarantee: at most one live attribution per lead, so two
-- publishers can never hold a simultaneous claim on the same lead.
create unique index if not exists lead_attributions_one_live_per_lead
  on public.lead_attributions (lead_id) where superseded_at is null;
create index if not exists lead_attributions_publisher_idx on public.lead_attributions (publisher_id);
create index if not exists lead_attributions_lead_idx      on public.lead_attributions (lead_id);

-- ─── 8 · commissions — what a publisher earned, as a record ──────────────────
create table if not exists public.commissions (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid          not null references public.leads (id)       on delete restrict,
  publisher_id uuid          not null references public.publishers (id)  on delete restrict,
  offer_id     uuid          not null references public.offers (id)      on delete restrict,
  client_id    uuid          not null references public.clients (id)     on delete restrict,
  amount       numeric(12,2) not null check (amount >= 0),
  currency     text          not null default 'USD',
  model        text          not null default 'flat'
                             check (model in ('flat','cpl','cpa','cpq','revshare','custom')),
  status       text          not null default 'payable'
                             check (status in ('payable','processing','paid','void','clawed_back')),
  payout_id    uuid                   references public.payouts (id) on delete set null,
  approved_by  text,
  created_at   timestamptz   not null default now(),
  paid_at      timestamptz,
  voided_at    timestamptz,
  void_reason  text,

  -- Money that stopped being owed must say why it stopped.
  constraint commissions_void_needs_reason
    check (status not in ('void','clawed_back')
           or (void_reason is not null and length(btrim(void_reason)) > 0)),
  constraint commissions_paid_needs_payout
    check (status <> 'paid' or payout_id is not null)
);

-- Paying twice for one lead is the worst failure this schema can have. One live
-- commission per lead, enforced by the database rather than by hope.
create unique index if not exists commissions_one_live_per_lead
  on public.commissions (lead_id) where status in ('payable','processing','paid');
create index if not exists commissions_publisher_status_idx on public.commissions (publisher_id, status);
create index if not exists commissions_payout_idx           on public.commissions (payout_id);
create index if not exists commissions_client_idx           on public.commissions (client_id);

-- ─── 9 · payouts — five states ───────────────────────────────────────────────
alter table public.payouts add column if not exists method text
  check (method is null or method in ('ach','paypal','check','other'));
alter table public.payouts add column if not exists reference      text;
alter table public.payouts add column if not exists failure_reason text;

alter table public.payouts drop constraint if exists payouts_status_check;
alter table public.payouts add constraint payouts_status_check
  check (status in ('pending','approved','processing','paid','failed'));

-- Same principle as a rejected lead: a failure must state its reason.
alter table public.payouts drop constraint if exists payouts_failure_needs_reason;
alter table public.payouts add constraint payouts_failure_needs_reason
  check (status <> 'failed' or (failure_reason is not null and length(btrim(failure_reason)) > 0));

-- ─── 10 · inquiries — structured consent ─────────────────────────────────────
-- Consent was previously appended as prose into the message field, which is not a
-- defensible TCPA record. These columns make it queryable and auditable.
alter table public.inquiries add column if not exists consent_granted boolean not null default false;
alter table public.inquiries add column if not exists consent_wording text;
alter table public.inquiries add column if not exists consent_at      timestamptz;
alter table public.inquiries add column if not exists consent_ip      text;

alter table public.inquiries drop constraint if exists inquiries_interest_type_check;
alter table public.inquiries add constraint inquiries_interest_type_check
  check (interest_type in ('client','publisher','other'));

create index if not exists inquiries_consent_idx on public.inquiries (consent_granted, created_at desc);

-- =============================================================================
-- Row Level Security
--
-- Unchanged in principle: the application holds the service-role key and BYPASSES RLS,
-- so service-layer scoping is what protects Route A. These policies protect Route B —
-- anything reaching Postgres directly with only the anon key.
-- =============================================================================

alter table public.products         enable row level security;
alter table public.campaigns        enable row level security;
alter table public.lead_attributions enable row level security;
alter table public.commissions      enable row level security;

-- Policies do follow a renamed table, but their names would still say "buyers".
-- Recreating them explicitly keeps the policy list readable.
drop policy if exists buyers_admin_all on public.clients;
drop policy if exists clients_admin_all on public.clients;
create policy clients_admin_all on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists contacts_admin_all on public.inquiries;
drop policy if exists inquiries_admin_all on public.inquiries;
create policy inquiries_admin_all on public.inquiries
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_admin_read on public.audit_entries;
drop policy if exists audit_entries_admin_read on public.audit_entries;
create policy audit_entries_admin_read on public.audit_entries
  for select using (public.is_admin());

-- products / campaigns: Reylix-internal. Admin writes; a signed-in publisher may read
-- them, because they describe the offers a publisher can already see.
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_publisher_read on public.products;
create policy products_publisher_read on public.products
  for select using (public.current_publisher_id() is not null);

drop policy if exists campaigns_admin_all on public.campaigns;
create policy campaigns_admin_all on public.campaigns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists campaigns_publisher_read on public.campaigns;
create policy campaigns_publisher_read on public.campaigns
  for select using (is_active and public.current_publisher_id() is not null);

-- lead_attributions: a publisher may see what they were credited for, and nothing else.
drop policy if exists lead_attributions_admin_all on public.lead_attributions;
create policy lead_attributions_admin_all on public.lead_attributions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists lead_attributions_self_read on public.lead_attributions;
create policy lead_attributions_self_read on public.lead_attributions
  for select using (publisher_id = public.current_publisher_id());

-- commissions: publisher-READABLE, never publisher-writable. A publisher able to insert
-- or update their own commission is the single worst failure mode in this schema, so
-- there is deliberately no such policy.
drop policy if exists commissions_admin_all on public.commissions;
create policy commissions_admin_all on public.commissions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists commissions_self_read on public.commissions;
create policy commissions_self_read on public.commissions
  for select using (publisher_id = public.current_publisher_id());

commit;
