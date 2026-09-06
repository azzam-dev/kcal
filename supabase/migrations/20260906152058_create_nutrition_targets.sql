-- Nutrition targets: what the calculation engine produced, for a stretch of days.
--
-- Append-only. Changing a goal writes a NEW row with a later effective date; it
-- never edits an old one. That is the whole point of the table: yesterday's
-- progress was measured against yesterday's target, and rewriting the target
-- silently rewrites the history of whether the day was met. There is no UPDATE
-- and no DELETE — not by convention, but because neither is granted or has a
-- policy (see below).

-- ─── Provenance ──────────────────────────────────────────────────────────────
-- An enum rather than a text column with a CHECK: it is written by application
-- code, and as an enum the generated `database.types.ts` turns it into a union,
-- so a misspelled 'calculcated' fails to compile instead of failing at insert.
--
-- Unlike the enums in the profiles migration, nothing in the calculation engine
-- keys off this value, so `database-contract.test.ts` has no counterpart to
-- guard here. It records where the numbers came from, for the day the formula
-- changes and old rows have to be told apart from new ones.

create type public.target_source as enum (
  'calculated',  -- محسوب من مدخلات المستخدم بمحرك الحساب
  'custom'       -- أدخله المستخدم بنفسه متجاوزاً الحساب
);

-- ─── Table ───────────────────────────────────────────────────────────────────

create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- The first day this target applies, in the USER's timezone — deliberately
  -- with no `default current_date`, which would be today in UTC. A default here
  -- would be right for most of the world and quietly wrong for the rest; the
  -- caller knows the profile's timezone and has to say.
  effective_from date not null,

  -- The engine rounds all six of these to whole numbers before they get here.
  bmr smallint not null,
  tdee smallint not null,
  calorie_target smallint not null,
  protein_g smallint not null,
  carb_g smallint not null,
  fat_g smallint not null,

  source public.target_source not null,

  -- A snapshot of the inputs this row was computed from: weight, height, birth
  -- year, activity level, goal. Stored so a target can still be explained
  -- months later, after the profile it came from has moved on — and so a
  -- formula change can be replayed against what the person actually entered.
  --
  -- jsonb and not columns because nothing queries inside it. The moment
  -- something does, that field earns a column of its own.
  inputs jsonb not null,

  created_at timestamptz not null default now(),

  -- One target per day per person. This is also what makes "the row in effect
  -- today" a single unambiguous row rather than a choice between duplicates.
  constraint nutrition_targets_one_per_day unique (user_id, effective_from),

  -- Sanity bounds only, wide on purpose. The product's real rules live in the
  -- domain layer, where they can produce a message the user can act on; these
  -- exist so that a write arriving by any other route cannot store a number
  -- that is not a daily intake at all.
  constraint nutrition_targets_bmr_range check (bmr between 500 and 5000),
  constraint nutrition_targets_tdee_range check (tdee between 500 and 10000),
  constraint nutrition_targets_calories_range check (calorie_target between 500 and 10000),
  constraint nutrition_targets_protein_range check (protein_g between 0 and 500),
  constraint nutrition_targets_carb_range check (carb_g between 0 and 2000),
  constraint nutrition_targets_fat_range check (fat_g between 0 and 500),

  -- The inputs snapshot is an object. A bare number or string in this column
  -- is a bug in the caller, and jsonb would otherwise accept both.
  constraint nutrition_targets_inputs_is_object check (jsonb_typeof(inputs) = 'object')
);

comment on table public.nutrition_targets is
  'Append-only history of daily targets. A goal change inserts a row with a new effective_from; rows are never updated or deleted, so past days keep the target they were measured against.';

-- No separate index for "the newest row at or before today": the unique
-- constraint above already builds a btree on (user_id, effective_from), and
-- Postgres scans it backwards for `order by effective_from desc limit 1`.
-- A second index would be the same data, kept up to date for nothing.

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.nutrition_targets enable row level security;

-- Least privilege at the grant level as well as the policy level, so that a
-- policy added carelessly later still cannot make the table writable in ways it
-- was never meant to be:
--   no UPDATE — a target is corrected by superseding it, not by editing it
--   no DELETE — rows go away by cascade when the auth user is deleted
revoke all on public.nutrition_targets from anon, authenticated;
grant select, insert on public.nutrition_targets to authenticated;

-- `(select auth.uid())` rather than a bare `auth.uid()`: wrapping it lets
-- Postgres evaluate it once per statement instead of once per row.
create policy nutrition_targets_select_own
  on public.nutrition_targets for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- `with check` and no `using`: an INSERT policy only ever inspects the incoming
-- row. This is what stops a client from writing a target into someone else's
-- history — the user_id in the payload is not trusted, it is required to match.
create policy nutrition_targets_insert_own
  on public.nutrition_targets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
