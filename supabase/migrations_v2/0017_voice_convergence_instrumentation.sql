-- Phase 15 (Voice-Convergence Proof) — instrumentation for the convergence curve.
-- Additive + idempotent only. No data dropped. Owner-scoped + FORCE RLS on the new table.
--
-- Measures whether aiTA learns a teacher's feedback voice over successive grading batches:
--   * grading_batches      — orders a teacher's finalize sessions so edit-rate is plottable per batch.
--   * submissions.batch_id — groups a finalized submission into its batch.
--   * submissions.edit_self_rating — the teacher's one-tap "how much did you change it?" (1=rewrote all .. 5=barely touched).
--   * annotations.edit_distance — normalized distance(ai_comment, comment) in [0,1], written when a teacher edits.
--     (Co-located on annotations because that table already holds BOTH the AI-original `ai_comment`
--      [0009/M50] and the teacher-final `comment`; this is the deviation noted in 15-PLAN Task 1A —
--      annotation_edits is the action log and lacks the text needed to derive the distance.)

-- 1. Batch grouping table (teacher-owned).
create table if not exists public.grading_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  assignment_id uuid,
  label text,
  seq integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists grading_batches_user_seq_idx
  on public.grading_batches (user_id, seq);

alter table public.grading_batches enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'grading_batches'
      and policyname = 'Users manage own grading batches'
  ) then
    create policy "Users manage own grading batches" on public.grading_batches
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- FORCE RLS (belt-and-suspenders; service_role keeps BYPASSRLS for edge functions).
alter table public.grading_batches force row level security;

-- 2. Per-submission batch grouping + self-rating (guarded — submissions exists in v2 schema).
do $$
begin
  if to_regclass('public.submissions') is not null then
    alter table public.submissions add column if not exists batch_id uuid;
    alter table public.submissions add column if not exists edit_self_rating smallint;
  end if;
end $$;

-- 3. Per-annotation edit-distance (guarded).
do $$
begin
  if to_regclass('public.annotations') is not null then
    alter table public.annotations add column if not exists edit_distance real;
  end if;
end $$;
