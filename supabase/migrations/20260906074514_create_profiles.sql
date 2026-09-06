-- Profiles: one row per authenticated user, created automatically at sign-up.
--
-- Everything the onboarding flow collects is nullable, because a user exists
-- before they have answered anything. `onboarded_at` — not "is every column
-- filled in" — is the single flag that says onboarding finished.
--
-- Current weight deliberately does NOT live here. It changes over time and is
-- the subject of its own history (`weight_entries`, Phase 08); a column here
-- would be a second source of truth that silently drifts from that history.

-- ─── Enumerations ────────────────────────────────────────────────────────────
-- Enums, not free text: these values drive the calculation engine, and a typo
-- in an activity level would silently change someone's calorie target rather
-- than fail. Adding a value later is `alter type ... add value`.

create type public.gender as enum ('male', 'female');

create type public.activity_level as enum (
  'sedentary',  -- ×1.20  لا تمرين تقريباً
  'light',      -- ×1.375 تمرين 1–3 أيام
  'moderate',   -- ×1.55  تمرين 3–5 أيام
  'very',       -- ×1.725 تمرين 6–7 أيام
  'extra'       -- ×1.90  نشاط بدني مرتفع جداً
);

create type public.goal as enum ('lose_fat', 'maintain', 'gain_muscle', 'custom');

-- ─── Table ───────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  display_name text,

  -- Birth YEAR, not age: a stored age silently goes stale and drags the BMR
  -- calculation with it. See docs/DECISIONS.md, amendment 3.
  birth_year smallint,
  gender public.gender,
  height_cm numeric(4, 1),

  activity_level public.activity_level,
  -- Collected but NOT a multiplier. Activity level already encodes training
  -- days; using both double-counts and inflates TDEE by hundreds of calories.
  -- This is only used to suggest a level when the two answers disagree.
  -- See docs/DECISIONS.md, amendment 2.
  training_days smallint,

  goal public.goal,
  target_weight_kg numeric(4, 1),

  -- "Today" is local to the user. Every daily total is grouped by a date
  -- computed in this zone, never by a UTC timestamp — otherwise a 2am meal
  -- lands on the wrong day for everyone outside UTC.
  timezone text not null default 'Asia/Riyadh',
  locale text not null default 'ar',

  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sanity bounds only. These stop absurd or hostile input from reaching the
  -- calculation engine; they are not the product's validation rules, which
  -- live in Zod and in the domain layer where they can produce a message the
  -- user can act on.
  constraint profiles_display_name_length check (char_length(display_name) <= 60),
  constraint profiles_height_range check (height_cm between 90 and 250),
  constraint profiles_training_days_range check (training_days between 0 and 7),
  constraint profiles_target_weight_range check (target_weight_kg between 20 and 400),
  constraint profiles_timezone_length check (char_length(timezone) between 1 and 64),
  constraint profiles_locale_length check (char_length(locale) between 2 and 8),

  -- A CHECK cannot call now(), so the real rule — a minimum age of 16 — cannot
  -- be expressed here. This bound only rejects impossible years; the age rule
  -- is enforced in the domain layer and covered by its own tests.
  constraint profiles_birth_year_sane check (birth_year between 1900 and 2200)
);

comment on table public.profiles is
  'One row per auth.users row, created by handle_new_user(). Onboarding fields are null until onboarding completes; onboarded_at is the completion flag.';

-- ─── Row level security ──────────────────────────────────────────────────────
-- Authorization lives here, not in application code, so there is no code path
-- that can forget it.

alter table public.profiles enable row level security;

-- Least privilege at the grant level too, so a missing policy cannot be the
-- only thing standing between a client and the table:
--   no INSERT — rows come from the sign-up trigger, never from a client
--   no DELETE — rows go away by cascade when the auth user is deleted
revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;

-- `(select auth.uid())` rather than a bare `auth.uid()`: wrapping it lets
-- Postgres evaluate it once per statement instead of once per row.
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- `set search_path = ''` with fully qualified names is not ceremony: a SECURITY
-- DEFINER function runs with the owner's privileges, and an attacker-controlled
-- search_path could otherwise point `profiles` at a table of their choosing.
create function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  -- Inserts the id and nothing else. Do not invent a display name from user
  -- metadata or from the email local-part: it produces a name the user never
  -- chose and then has to discover and correct.
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── Account deletion ────────────────────────────────────────────────────────
-- Deleting an auth user normally needs the service_role key. Routing it through
-- a SECURITY DEFINER function that can only ever delete `auth.uid()` keeps that
-- key out of the application entirely: there is no privileged credential to
-- leak, and no code path that can be tricked into deleting a different account.
--
-- Everything the user owns is removed by the cascade from auth.users. This is a
-- real delete, not a disabled flag.

create function public.delete_own_account()
  returns void
  language sql
  security definer
  set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
