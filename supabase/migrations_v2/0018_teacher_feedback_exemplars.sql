-- Phase 15 (Voice-Convergence Proof) — Wave 2: binary-signal few-shot exemplar store.
-- Additive + idempotent only. No data dropped. Owner-scoped + FORCE RLS on the new table.
--
-- Upgrades the reinforce loop from a single prose style blurb (teacher_style_profiles.style_summary)
-- to per-teacher binary-signal exemplars derived from the teacher's OWN accept/edit/dismiss decisions
-- on aiTA's annotations (PROOF-02):
--   * kind='positive'   — teacher ACCEPTED aiTA's note verbatim   (final_text = the kept wording)
--   * kind='correction' — teacher EDITED it (ai_text -> final_text, with the normalized edit_distance)
--   * kind='negative'   — teacher DISMISSED it                     (ai_text = the rejected wording)
-- `rebuild-exemplars` repopulates this table after each finalized batch; engine.ts injects top-K into
-- the grading prompt's cacheable prefix. NO student PII: rebuild-exemplars de-identifies (scrubNames)
-- before insert, so a name from one student's feedback can never leak into another student's prompt.
-- The prose summary stays as the cold-start fallback (LEARN-06).

create table if not exists public.teacher_feedback_exemplars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('positive', 'correction', 'negative')),
  annotation_type text,             -- praise|suggestion|error|question (matchable context, NOT a rubric criterion)
  ai_text text,                     -- aiTA's original wording (correction + negative)
  final_text text,                  -- the teacher's final wording (positive + correction)
  quote text,                       -- the de-identified student span the note was about
  edit_distance real,               -- normalized [0,1] for corrections; null otherwise
  source_submission_id uuid,
  batch_id uuid,
  created_at timestamptz not null default now()
);

-- Top-K selection is "newest first" (see grade-submission); index supports it + the per-user rebuild.
create index if not exists teacher_feedback_exemplars_user_created_idx
  on public.teacher_feedback_exemplars (user_id, created_at desc);

alter table public.teacher_feedback_exemplars enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'teacher_feedback_exemplars'
      and policyname = 'Users manage own feedback exemplars'
  ) then
    create policy "Users manage own feedback exemplars" on public.teacher_feedback_exemplars
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- FORCE RLS (belt-and-suspenders; service_role keeps BYPASSRLS for edge functions).
alter table public.teacher_feedback_exemplars force row level security;
