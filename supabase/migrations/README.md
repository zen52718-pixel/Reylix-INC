# Migrations

Numbered, forward-only SQL migrations. The schema is no longer maintained as a single
hand-applied file.

| File | What it does |
|---|---|
| `0001_initial_schema.sql` | The Sprint 0 baseline, preserved verbatim. Creates `buyers`, `contacts`, `audit` and the original RLS policies. |
| `0002_step2_domain.sql` | The Step 2 domain migration: `buyers`→`clients`, `contacts`→`inquiries`, `audit`→`audit_entries`, plus `products`, `campaigns`, `lead_attributions`, `commissions`. |

Apply in order:

```bash
supabase db execute --file supabase/migrations/0001_initial_schema.sql
supabase db execute --file supabase/migrations/0002_step2_domain.sql
```

`0001` is kept rather than folded into a single clean schema so the migration history
shows the transition honestly. It is not the current shape of the database on its own.

## What has NOT been verified

**No Supabase project has been provisioned, so nothing in this directory has ever been
executed.** Both files are written carefully and reviewed, but "carefully written" and
"known to run" are different states, and this is the former.

Specifically unverified:

- That both migrations apply cleanly, in order, against a fresh Postgres instance.
- That every `alter table ... drop column` matches a column `0001` actually created.
- That the auto-generated constraint names dropped in `0002` (`payouts_status_check`,
  `inquiries_interest_type_check`) are the names Postgres actually assigned. If Postgres
  named them differently, those `drop constraint if exists` statements will silently do
  nothing and the new constraint will fail to add.
- That every RLS policy behaves as intended — in particular that a publisher genuinely
  **cannot** read another publisher's commissions or attributions using the anon key.
- That `public.is_admin()` and `public.current_publisher_id()`, defined in `0001`,
  resolve correctly for a real Supabase Auth session.

## First steps once a project exists

1. Apply `0001` then `0002` against a **disposable** project.
2. Insert an admin address into `public.admin_users` — an address in `ADMIN_EMAILS` alone
   is not an admin at the database level.
3. Run the shared contract test against the live adapter:
   `RUN_SUPABASE_CONTRACT=1 npm test`.
4. Write the cross-publisher RLS test: publisher A must provably fail to read publisher
   B's commissions with the anon key. Until that test exists and passes, RLS should be
   treated as intended rather than enforced.
