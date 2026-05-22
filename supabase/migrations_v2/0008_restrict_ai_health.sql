-- AI model health is operational/internal data, not for teachers (M56). Remove the
-- world-readable SELECT policy so only service-role (server functions) can read it.
drop policy if exists "Teachers can view AI model health" on public.ai_model_health;

-- ai_request_logs: stop exposing system rows (user_id IS NULL) to every signed-in user;
-- a teacher should only see their own request logs.
drop policy if exists "Users can view their own AI request logs" on public.ai_request_logs;
create policy "Users can view their own AI request logs"
  on public.ai_request_logs
  for select
  using (auth.uid() = user_id);
