-- Phase 1 / Phase 13 (SEC-01): belt-and-suspenders owner-scoped RLS on teacher-owned tables that
-- the v1 backup may or may not have policied. Idempotent: enable RLS + (re)create owner CRUD policies.
-- Safe to run repeatedly; guarantees a teacher can only ever read/write their own rows regardless of
-- which historical migration first created the table.
do $$
declare t text;
begin
  foreach t in array array['training_examples', 'ai_profiles'] loop
    -- Skip cleanly if the table doesn't exist in this database.
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_sel', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_ins', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_upd', t);
    execute format('drop policy if exists %I on public.%I;', t || '_owner_del', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = user_id);', t || '_owner_sel', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id);', t || '_owner_ins', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t || '_owner_upd', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id);', t || '_owner_del', t);
  end loop;
end $$;
