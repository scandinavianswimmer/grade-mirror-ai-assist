-- BILL-03: 14-day full-access trial (XPRIZE Master Plan Week 1).
-- Additive + idempotent only. No data dropped.
--
-- A zero-friction trial: a new teacher gets FULL (Pro-cap) access for 14 days from signup, with NO
-- card required up front — Stripe is entered only at conversion. EdTech trial→paid converts ~10x
-- better than permanent freemium (24.8% vs 2.6%), so this is the revenue engine for Cohort A. After
-- the trial, the teacher falls to the thin Free floor (15 gradings/month) until they subscribe.
--
-- Mechanism: trial state lives on public.users (trial_started_at / trial_ends_at). New rows get the
-- window via COLUMN DEFAULTS — no trigger change needed (handle_new_user inserts users without these
-- columns, so the defaults apply). Existing rows are backfilled to created_at + 14 days, i.e. already
-- expired for old accounts (correct: they were free users before this existed).
--
-- ⚠️ FOUNDER: apply this (DB password) for the trial cap to take effect server-side. Until applied,
-- the quota RPC fails open exactly as before and the client treats everyone by their subscription.

-- 1) Trial window columns (added without a default first so the backfill is deterministic).
alter table public.users add column if not exists trial_started_at timestamptz;
alter table public.users add column if not exists trial_ends_at     timestamptz;

-- 2) Backfill existing accounts: trial began at signup and (for any account older than 14 days)
--    is already expired. Idempotent — only touches rows not yet stamped.
update public.users
   set trial_started_at = created_at,
       trial_ends_at    = created_at + interval '14 days'
 where trial_started_at is null;

-- 3) New signups: a fresh 14-day trial from row creation, applied automatically via defaults.
alter table public.users alter column trial_started_at set default now();
alter table public.users alter column trial_ends_at     set default (now() + interval '14 days');

-- 4) Grant the Pro grading cap while the trial is active. Re-defines consume_grading_quota (0019)
--    additively (CREATE OR REPLACE, signature unchanged) to raise a free/trialing teacher to the Pro
--    monthly cap during their window and report plan='trial' so the UI message is accurate. Identity
--    is auth.uid() only; FAILS OPEN if absent (quota.ts). Keep caps in sync with _shared/plan-limits.ts.
create or replace function public.consume_grading_quota(p_units integer default 1)
returns table(allowed boolean, used integer, max_weekly integer, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cnt integer;
  last_reset date;
  pl text;
  trial_ends timestamptz;
  is_trial boolean;
  lim integer;
  n integer := greatest(coalesce(p_units, 1), 1);
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(weekly_feedback_count, 0), last_reset_date, coalesce(plan, 'free'), trial_ends_at
    into cnt, last_reset, pl, trial_ends
    from public.users
    where id = uid
    for update;

  if not found then
    raise exception 'user not found';
  end if;

  is_trial := trial_ends is not null and now() < trial_ends;

  -- Canonical MONTHLY grading caps (must match _shared/plan-limits.ts):
  --   Free = 15, Pro = 500, Enterprise = high fair-use ceiling. 'freemium' = legacy alias for free.
  lim := case pl
           when 'free'     then 15
           when 'freemium' then 15
           when 'pro'      then 500
           else 100000
         end;

  -- Active trial grants the Pro cap to an otherwise-free teacher (never lowers a higher plan).
  if is_trial and lim < 500 then
    lim := 500;
    pl  := 'trial';
  end if;

  -- Monthly reset window: zero the ledger once we cross into a new calendar month.
  if last_reset is null or last_reset < date_trunc('month', current_date)::date then
    cnt := 0;
    update public.users set last_reset_date = current_date where id = uid;
  end if;

  if cnt + n > lim then
    return query select false, cnt, lim, pl;
    return;
  end if;

  update public.users set weekly_feedback_count = cnt + n where id = uid;
  return query select true, cnt + n, lim, pl;
end;
$$;

revoke all on function public.consume_grading_quota(integer) from public;
grant execute on function public.consume_grading_quota(integer) to authenticated;
