-- BILL-02: align the atomic grading-quota RPC with the canonical plan caps.
-- Section 3 of LAUNCH-PLAN sets per-MONTH grading limits: Free = 15, Pro = 500 (fair-use).
-- The original consume_grading_quota (0015) used WEEKLY caps (100 / 2000) keyed on a 'freemium'
-- plan label that never matches the real users.plan vocabulary ('free' | 'pro' | 'enterprise'),
-- so a 'free' teacher fell into the else branch (100000) and was effectively un-capped.
--
-- This migration redefines the function (CREATE OR REPLACE — additive, idempotent, signature
-- unchanged) to:
--   * key the cap on the real plan values, accepting 'freemium' as a legacy alias for 'free';
--   * use the canonical MONTHLY caps (mirrors _shared/plan-limits.ts — keep the two in sync);
--   * reset the ledger on a CALENDAR-MONTH boundary (the cap is per-month, not per-week).
--
-- quota.ts is unaffected: it reads {allowed, used, max_weekly, plan} from the row regardless of the
-- cap values and FAILS OPEN if this function is absent. Identity is auth.uid() (verified JWT) only.
--
-- ⚠️ FOUNDER: this migration must be applied (needs the DB password) for real Free-vs-Pro gating.
-- Until applied, grading fails open exactly as before.
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
  lim integer;
  n integer := greatest(coalesce(p_units, 1), 1);
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(weekly_feedback_count, 0), last_reset_date, coalesce(plan, 'free')
    into cnt, last_reset, pl
    from public.users
    where id = uid
    for update;

  if not found then
    raise exception 'user not found';
  end if;

  -- Canonical MONTHLY grading caps (must match _shared/plan-limits.ts):
  --   Free = 15, Pro = 500, Enterprise = high fair-use ceiling.
  -- 'freemium' is accepted as a legacy alias for the free tier.
  lim := case pl
           when 'free'     then 15
           when 'freemium' then 15
           when 'pro'      then 500
           else 100000
         end;

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
