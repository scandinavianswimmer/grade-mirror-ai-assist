-- Rate-limit Layer A (SEC): atomic per-teacher grading quota gate.
-- The grading path previously called the paid Gemini API with NO pre-call quota check, so an
-- authenticated teacher had unlimited grading regardless of plan. This RPC makes grading consume
-- the same weekly ledger as the plan limit, enforced transactionally (race-safe) before any model
-- call. Modeled on increment_weekly_feedback (0003) but with generous, grading-appropriate caps
-- and an optional p_units so bulk enqueue can reserve a whole batch atomically.
--
-- Identity is auth.uid() (the verified JWT) inside the function — never a client-supplied id.
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

  select coalesce(weekly_feedback_count, 0), last_reset_date, coalesce(plan, 'freemium')
    into cnt, last_reset, pl
    from public.users
    where id = uid
    for update;

  if not found then
    raise exception 'user not found';
  end if;

  -- Grading-appropriate weekly caps (deliberately higher than the legacy feedback meter).
  lim := case pl
           when 'freemium' then 100
           when 'pro' then 2000
           else 100000
         end;

  -- Weekly reset window.
  if last_reset is null or last_reset < (current_date - interval '7 days') then
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
