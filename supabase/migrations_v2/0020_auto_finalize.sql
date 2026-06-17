-- BILL/GRADE: Auto-Finalize (XPRIZE Master Plan Week 1, must-go-right #1).
-- Additive + idempotent only. No data dropped.
--
-- Lets aiTA PUBLISH high-confidence, on-topic, rubric-aligned grades UNATTENDED ("On-the-Loop":
-- the teacher monitors the needs_review exception queue instead of approving every grade). This is
-- what makes the AI-native operating claim TRUE rather than narrated, and what the demo video shows.
--
-- The grade-submission edge function tolerates the absence of these columns (best-effort writes), so
-- grading keeps working before this migration is applied. Applying it turns on the auto-finalize
-- behavior and its provenance/audit trail. Identity stays auth.uid(); no new RLS needed (column adds
-- on already-RLS'd tables; existing owner-scoped policies cover access).
--
-- ⚠️ FOUNDER: apply this (needs the DB password) for auto-finalize to take effect. Until applied,
-- grading behaves exactly as before (the function falls back to the in-code defaults but cannot
-- persist provenance, so nothing auto-finalizes).

-- 1) Per-teacher auto-finalize preference (opt-out: default ON; the product thesis is unattended
--    grading). The confidence floor is additionally clamped to >= 0.6 in code.
alter table public.privacy_settings
  add column if not exists auto_finalize_enabled boolean not null default true;

alter table public.privacy_settings
  add column if not exists auto_finalize_threshold numeric not null default 0.85;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'privacy_settings_auto_finalize_threshold_range'
  ) then
    alter table public.privacy_settings
      add constraint privacy_settings_auto_finalize_threshold_range
      check (auto_finalize_threshold >= 0.6 and auto_finalize_threshold <= 1.0);
  end if;
end $$;

-- 2) Provenance on the submission: who finalized this grade, and (for the agent evidence trail)
--    when it was auto-published. 'ai' vs 'teacher' drives the UI label and the AI-native count.
alter table public.submissions
  add column if not exists finalized_by text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'submissions_finalized_by_values'
  ) then
    alter table public.submissions
      add constraint submissions_finalized_by_values
      check (finalized_by is null or finalized_by in ('ai', 'teacher'));
  end if;
end $$;

alter table public.submissions
  add column if not exists auto_finalized_at timestamptz;

-- Partial index for the monitoring/exception dashboards: fast "how many did the agent publish".
create index if not exists submissions_auto_finalized_at_idx
  on public.submissions (auto_finalized_at)
  where auto_finalized_at is not null;

-- 3) Backfill provenance for grades a teacher already finalized by hand, so historical rows read
--    correctly under the new label logic (v2 status has no 'exported' state; only 'finalized').
update public.submissions
   set finalized_by = 'teacher'
 where finalized_by is null
   and status = 'finalized';

-- handle_new_user (0001/0016) inserts privacy_settings(user_id) and relies on column defaults, so
-- new teachers pick up auto_finalize_enabled=true / threshold=0.85 automatically — no trigger change.
