-- Atomic weekly-feedback usage limit (H33).
-- Replaces the racy client check-then-increment with a single transactional RPC that
-- locks the user row, applies the weekly reset, enforces the plan limit, and increments —
-- all in one statement. Identity comes from auth.uid() (the verified JWT), never the client.
create or replace function public.increment_weekly_feedback()
returns table(allowed boolean, new_count integer, max_weekly integer, plan text)
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

  lim := case when pl = 'freemium' then 10 else 100 end;

  -- Weekly reset window.
  if last_reset is null or last_reset < (current_date - interval '7 days') then
    cnt := 0;
    update public.users set last_reset_date = current_date where id = uid;
  end if;

  if cnt >= lim then
    return query select false, cnt, lim, pl;
    return;
  end if;

  update public.users set weekly_feedback_count = cnt + 1 where id = uid;
  return query select true, cnt + 1, lim, pl;
end;
$$;

revoke all on function public.increment_weekly_feedback() from public;
grant execute on function public.increment_weekly_feedback() to authenticated;
