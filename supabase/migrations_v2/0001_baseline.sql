-- aiTA V2 — squashed, replayable baseline schema
-- Replaces the 14 drifted migrations in ../migrations (archive those; see ../functions/README-BACKEND-V2.md).
-- Principles: per-teacher RLS isolation, WITH CHECK on every write, privileged columns server-only,
-- structured rubrics + first-class annotations, consent/retention/audit, encrypted-at-rest LMS creds.
-- Identity always derives from auth.uid(); no client-supplied user ids are trusted.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- users (teacher profile). Privileged columns (plan/role/usage) are server-only.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text,
  role                  text not null default 'teacher' check (role in ('teacher','admin')),
  plan                  text not null default 'free'   check (plan in ('free','pro','enterprise')),
  weekly_feedback_count int  not null default 0,
  last_reset_date       date not null default current_date,
  onboarding_complete   boolean not null default false,
  school                text,
  years_experience      int,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- classes → assignments → rubrics/rubric_criteria → submissions → grades/annotations
-- ─────────────────────────────────────────────────────────────────────────────
create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index classes_user_id_idx on public.classes(user_id);
create trigger classes_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

create table public.assignments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  class_id      uuid references public.classes(id) on delete set null,
  title         text not null,
  instructions  text,                       -- raw assignment instructions (parsed into criteria)
  course_name   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index assignments_user_id_idx on public.assignments(user_id);
create trigger assignments_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

-- Structured rubric: one rubric per assignment, N weighted criteria with level descriptors.
create table public.rubrics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  total_points  numeric not null default 100,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index rubrics_assignment_id_idx on public.rubrics(assignment_id);
create trigger rubrics_updated_at before update on public.rubrics
  for each row execute function public.set_updated_at();

create table public.rubric_criteria (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  rubric_id         uuid not null references public.rubrics(id) on delete cascade,
  name              text not null,
  weight            numeric not null default 1,
  max_score         numeric not null default 10,
  level_descriptors jsonb not null default '{}'::jsonb,  -- { "4": "...", "3": "...", ... }
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);
create index rubric_criteria_rubric_id_idx on public.rubric_criteria(rubric_id);

create table public.submissions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  assignment_id         uuid not null references public.assignments(id) on delete cascade,
  student_name          text,                 -- PII — see anonymization + consent below
  student_ref           text,                 -- opaque id used when de-identifying to the model
  file_path             text,                 -- storage object path
  extracted_text        text,
  extraction_confidence numeric,              -- 0..1; low/empty => needs_review, do NOT auto-grade
  status                text not null default 'uploaded'
                          check (status in ('uploaded','needs_review','grading','graded','grade_error','finalized')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index submissions_assignment_id_idx on public.submissions(assignment_id);
create index submissions_user_id_idx on public.submissions(user_id);
create trigger submissions_updated_at before update on public.submissions
  for each row execute function public.set_updated_at();

-- One AI grade per submission (latest wins; history kept in llm_sessions).
create table public.submission_grades (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  submission_id   uuid not null references public.submissions(id) on delete cascade,
  schema_version  text not null,
  overall_score   numeric,                    -- server-recomputed from weighted criteria
  overall_max     numeric,
  letter          text,
  confidence      numeric,
  criteria        jsonb not null default '[]'::jsonb,   -- verified GradingResult.criteria
  summary_feedback text,
  flags           jsonb not null default '[]'::jsonb,
  model_id        text,
  created_at      timestamptz not null default now()
);
create index submission_grades_submission_id_idx on public.submission_grades(submission_id);

-- First-class annotations with char offsets + match status (never silently dropped).
create table public.annotations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  start_index   int,
  end_index     int,
  quote         text not null,
  comment       text not null,
  type          text not null default 'suggestion' check (type in ('praise','suggestion','error','question')),
  matched       boolean not null default false,   -- false => unplaced; surfaced, not dropped
  status        text not null default 'pending'   check (status in ('pending','accepted','rejected','edited')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index annotations_submission_id_idx on public.annotations(submission_id);
create trigger annotations_updated_at before update on public.annotations
  for each row execute function public.set_updated_at();

-- Reinforcement signal: teacher accept/reject/edit feeds future personalization (Sprint 2).
create table public.annotation_edits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  annotation_id uuid not null references public.annotations(id) on delete cascade,
  action        text not null check (action in ('accept','reject','edit')),
  original      jsonb,
  revised       jsonb,
  created_at    timestamptz not null default now()
);
create index annotation_edits_user_id_idx on public.annotation_edits(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Personalization: unified training examples + distilled style profile
-- ─────────────────────────────────────────────────────────────────────────────
create table public.training_examples (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  essay       text not null,
  rubric_text text,
  feedback    text,
  grade       text,
  source      text not null default 'upload' check (source in ('upload','reinforcement')),
  created_at  timestamptz not null default now()
);
create index training_examples_user_id_idx on public.training_examples(user_id);

create table public.teacher_style_profiles (
  user_id        uuid primary key references public.users(id) on delete cascade,
  style_summary  text,                      -- distilled, INJECTED into the grader (Sprint 2)
  style_json     jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);
create trigger teacher_style_profiles_updated_at before update on public.teacher_style_profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- AI ops: per-request audit, model health (circuit breaker)
-- ─────────────────────────────────────────────────────────────────────────────
create table public.llm_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete set null,
  kind          text not null,              -- 'grade' | 'style' | 'extract' ...
  model_id      text,
  prompt_hash   text,
  input_tokens  int,
  output_tokens int,
  cache_read_tokens int,
  latency_ms    int,
  ok            boolean not null default true,
  created_at    timestamptz not null default now()
);
create index llm_sessions_user_id_idx on public.llm_sessions(user_id);

create table public.ai_request_logs (
  id          uuid primary key default gen_random_uuid(),
  model_id    text not null,
  ok          boolean not null,
  error_type  text,
  latency_ms  int,
  created_at  timestamptz not null default now()
);

create table public.ai_model_health (
  model_id          text primary key,
  consecutive_fails int not null default 0,
  healthy           boolean not null default true,
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Privacy: consent, retention policy, access audit
-- ─────────────────────────────────────────────────────────────────────────────
create table public.privacy_settings (
  user_id                  uuid primary key references public.users(id) on delete cascade,
  allow_training_on_content boolean not null default false,  -- least-permissive default; enforced server-side
  anonymize_student_names   boolean not null default true,
  retention_days            int not null default 365,
  updated_at               timestamptz not null default now()
);
create trigger privacy_settings_updated_at before update on public.privacy_settings
  for each row execute function public.set_updated_at();

create table public.consent_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  scope       text not null,                 -- 'train_on_student_work' | 'share_with_ai_vendor' ...
  granted     boolean not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index consent_records_user_id_idx on public.consent_records(user_id);

create table public.access_audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid,
  action       text not null,
  resource     text not null,               -- e.g. 'submission:<id>'
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- LMS credentials: NO client access at all (deny-by-default RLS, service-role only).
-- Production: store secrets in Supabase Vault and keep only a vault ref here.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.lms_credentials (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  platform        text not null default 'canvas' check (platform in ('canvas')),
  canvas_url      text,
  vault_secret_id uuid,                      -- reference into Supabase Vault (preferred)
  access_token_enc  bytea,                   -- fallback: pgcrypto-encrypted; never plain text
  refresh_token_enc bytea,
  token_expires_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index lms_credentials_user_id_idx on public.lms_credentials(user_id);
create trigger lms_credentials_updated_at before update on public.lms_credentials
  for each row execute function public.set_updated_at();

-- Lead-gen (was undocumented + drifted in v1). Anon INSERT only; nobody can read via anon/auth.
create table public.enterprise_contacts (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  org        text,
  message    text,
  created_at timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════════════════════════════════════════
alter table public.users                  enable row level security;
alter table public.classes                enable row level security;
alter table public.assignments            enable row level security;
alter table public.rubrics                enable row level security;
alter table public.rubric_criteria        enable row level security;
alter table public.submissions            enable row level security;
alter table public.submission_grades      enable row level security;
alter table public.annotations            enable row level security;
alter table public.annotation_edits       enable row level security;
alter table public.training_examples      enable row level security;
alter table public.teacher_style_profiles enable row level security;
alter table public.llm_sessions           enable row level security;
alter table public.ai_request_logs        enable row level security;
alter table public.ai_model_health        enable row level security;
alter table public.privacy_settings       enable row level security;
alter table public.consent_records        enable row level security;
alter table public.access_audit_log       enable row level security;
alter table public.lms_credentials        enable row level security;
alter table public.enterprise_contacts    enable row level security;

-- users: a teacher reads/updates only their own row; cannot escalate privileged columns.
create policy users_select on public.users for select using (auth.uid() = id);
create policy users_update on public.users for update
  using (auth.uid() = id) with check (auth.uid() = id);
-- Lock privileged columns from client writes (mutated only by service-role functions).
revoke update (role, plan, weekly_feedback_count, last_reset_date) on public.users from authenticated;

-- Generic per-owner policy for the owner_id = auth.uid() tables.
-- (Written explicitly per table so WITH CHECK is always present on writes.)
do $$
declare t text;
begin
  foreach t in array array[
    'classes','assignments','rubrics','rubric_criteria','submissions','submission_grades',
    'annotations','annotation_edits','training_examples','consent_records'
  ] loop
    execute format('create policy %1$s_sel on public.%1$s for select using (auth.uid() = user_id);', t);
    execute format('create policy %1$s_ins on public.%1$s for insert with check (auth.uid() = user_id);', t);
    execute format('create policy %1$s_upd on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('create policy %1$s_del on public.%1$s for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- teacher_style_profiles + privacy_settings: keyed by user_id as PK.
create policy style_sel on public.teacher_style_profiles for select using (auth.uid() = user_id);
create policy style_ins on public.teacher_style_profiles for insert with check (auth.uid() = user_id);
create policy style_upd on public.teacher_style_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy privacy_sel on public.privacy_settings for select using (auth.uid() = user_id);
create policy privacy_ins on public.privacy_settings for insert with check (auth.uid() = user_id);
create policy privacy_upd on public.privacy_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- llm_sessions: owner may read their own; writes happen via service role only (no insert policy).
create policy llm_sessions_sel on public.llm_sessions for select using (auth.uid() = user_id);

-- ai_request_logs / ai_model_health / access_audit_log: service-role only (NO policies => deny all).
-- lms_credentials: service-role only (NO policies => deny all to anon/authenticated).

-- enterprise_contacts: allow anonymous lead capture INSERT only; no client reads.
create policy enterprise_contacts_ins on public.enterprise_contacts for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Bootstrap: create profile + default privacy settings on signup.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.privacy_settings (user_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
