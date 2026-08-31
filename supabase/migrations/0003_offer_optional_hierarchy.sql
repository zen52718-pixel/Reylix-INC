-- =============================================================================
-- 0003 — Optional offer hierarchy + rejected publisher status
--
-- Two approved changes:
--
--  1. An Offer may OPTIONALLY belong to a Product and/or a Campaign. Migration 0002 made
--     `campaign_id` NOT NULL on the reasoning that an offer without a campaign drops out
--     of campaign-grouped reporting. That reasoning still holds for reporting, but the
--     business has confirmed that an admin must be able to create a standalone offer that
--     belongs to no programme. Reporting therefore handles an "unassigned" bucket rather
--     than assuming the case cannot arise.
--
--  2. Publishers gain a `rejected` status. Portal access requires ACTIVE; pending,
--     rejected and suspended are all refused. Without this value a rejected applicant
--     could only be represented as suspended, which conflates "we said no" with "we
--     turned you off", and those are different facts a publisher may ask about.
--
-- Forward-only. 0001 and 0002 are committed and are not modified.
--
-- NOT YET VERIFIED — no Supabase project exists at the time of writing. See
-- supabase/migrations/README.md.
-- =============================================================================

begin;

-- ─── 1 · offers: product and campaign both optional ──────────────────────────

alter table public.offers add column if not exists product_id uuid;

alter table public.offers
  drop constraint if exists offers_product_id_fkey;
alter table public.offers
  add constraint offers_product_id_fkey
  foreign key (product_id) references public.products (id) on delete restrict;

-- Relax the constraint 0002 set. The column stays; only the requirement is lifted.
alter table public.offers alter column campaign_id drop not null;

-- `client_id` deliberately remains NOT NULL: an offer exists to deliver leads to a
-- client, so an offer without one has no purpose. Only the Product/Campaign association
-- was made optional.

create index if not exists offers_product_idx on public.offers (product_id);

-- ─── 2 · keep the two associations from contradicting each other ─────────────
--
-- If an offer names both a product and a campaign, the campaign must belong to that
-- product. Otherwise an offer could claim to be Real Estate while sitting in a Home
-- Services campaign, and every report built on either association would disagree with
-- the other.
--
-- Expressed as a trigger rather than a CHECK because the rule spans two tables, which a
-- CHECK constraint cannot see.

create or replace function public.offers_assert_hierarchy()
returns trigger
language plpgsql
as $$
declare
  campaign_product uuid;
begin
  if new.campaign_id is null or new.product_id is null then
    return new;
  end if;

  select c.product_id into campaign_product
  from public.campaigns c
  where c.id = new.campaign_id;

  if campaign_product is distinct from new.product_id then
    raise exception
      'offer %: product_id (%) does not match the product of campaign % (%)',
      coalesce(new.offer_code, '?'), new.product_id, new.campaign_id, campaign_product
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists offers_hierarchy_check on public.offers;
create trigger offers_hierarchy_check
  before insert or update of product_id, campaign_id on public.offers
  for each row execute function public.offers_assert_hierarchy();

-- ─── 3 · publishers: rejected status ─────────────────────────────────────────

alter table public.publishers drop constraint if exists publishers_status_check;
alter table public.publishers add constraint publishers_status_check
  check (status in ('pending', 'active', 'rejected', 'suspended'));

-- ─── 4 · portal access is ACTIVE only ────────────────────────────────────────
--
-- `current_publisher_id()` is what every publisher-scoped RLS policy resolves. Until now
-- it returned a publisher regardless of status, so a suspended publisher holding a valid
-- session would still satisfy every policy. Restricting it here closes that at the
-- database level, in addition to the check the application performs.

create or replace function public.current_publisher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.publishers p
  where p.auth_user_id = auth.uid()
    and p.status = 'active'
  limit 1;
$$;

commit;
