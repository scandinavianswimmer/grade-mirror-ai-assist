-- RLS hardening (audit MEDIUM-1, MEDIUM-2). Idempotent; every statement guards on table existence.

-- MEDIUM-2: teacher_comments policy validated the submission→assignment ownership chain but did NOT
-- validate that user_id = auth.uid(), so a teacher could INSERT a comment attributed to another
-- teacher's user_id (data-attribution corruption; cross-tenant READ was already blocked). Re-create
-- the policy with user_id enforced in BOTH USING and WITH CHECK. Guarded — teacher_comments is a v1
-- table that may not exist in the v2 schema.
do $$
begin
  if to_regclass('public.teacher_comments') is not null then
    drop policy if exists "Users can manage comments for own submissions" on public.teacher_comments;
    create policy "Users can manage comments for own submissions"
      on public.teacher_comments for all
      using (
        auth.uid() = user_id
        and exists (
          select 1 from public.submissions s
          join public.assignments a on s.assignment_id = a.id
          where s.id = teacher_comments.submission_id and a.user_id = auth.uid()
        )
      )
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.submissions s
          join public.assignments a on s.assignment_id = a.id
          where s.id = teacher_comments.submission_id and a.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- MEDIUM-1: FORCE ROW LEVEL SECURITY so a compromised/misused table-owner credential can't silently
-- bypass tenant isolation. The Supabase service_role (used by edge functions) has BYPASSRLS and is
-- unaffected; per-user policies already enforce isolation for the authenticated role, so FORCE is
-- belt-and-suspenders for those.
--
-- NOTE: public.users is intentionally EXCLUDED — the handle_new_user() SECURITY DEFINER signup
-- trigger inserts into it, and forcing RLS there risks breaking account creation. Harden users
-- separately only after verifying the trigger path in staging.
do $$
declare t text;
begin
  foreach t in array array[
    'assignments','submissions','classes','rubrics','rubric_criteria',
    'submission_grades','annotations','annotation_edits','teacher_style_profiles',
    'training_examples','grading_examples','ai_profiles','privacy_settings','consent_records',
    'llm_sessions','lms_credentials','lms_integrations','subscriptions','agent_events',
    'podcast_episodes','ai_model_health','ai_request_logs','teacher_profiles','teacher_edits',
    'teacher_comments','training_data','access_audit_log'
  ] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;
