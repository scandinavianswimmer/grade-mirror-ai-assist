-- Phase 3 (AGENT-02): per-step observability for the grading agent workflow.
-- Every grading run is a "job" (job_id) composed of named agent steps (rubric, relevance_risk,
-- grading, annotation, feedback_summary, style). Each step logs status/model/latency/tokens so the
-- UI can show the pipeline (AGENT-03) and the analytics tracing hook (Phase 11 tracing.ts) has a
-- backing table. Additive + idempotent. Writes are service-role only; teachers read their own rows.
create table if not exists public.agent_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  submission_id uuid references public.submissions(id) on delete cascade,
  job_id        uuid not null,                 -- groups one grading run's steps (the trace id)
  agent         text not null,                 -- rubric | relevance_risk | grading | annotation | feedback_summary | style
  status        text not null default 'ok',    -- ok | error | skipped
  model_id      text,
  latency_ms    integer,
  input_tokens  integer,
  output_tokens integer,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists agent_events_submission_idx on public.agent_events(submission_id);
create index if not exists agent_events_job_idx on public.agent_events(job_id);
create index if not exists agent_events_user_idx on public.agent_events(user_id);

alter table public.agent_events enable row level security;

-- Owner-scoped read; no client write policy (the grading orchestrator writes via the service role).
drop policy if exists agent_events_owner_select on public.agent_events;
create policy agent_events_owner_select on public.agent_events
  for select using (auth.uid() = user_id);
