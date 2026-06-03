-- v1→v2 ADDITIVE cutover (non-destructive): add the v2 grading tables/columns the deployed
-- Gemini functions need, on top of the existing v1 schema. v1 data + frontend keep working.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── submissions: v2 columns the grader/ingest read/write (backfilled from v1) ──
alter table public.submissions add column if not exists extracted_text text;
alter table public.submissions add column if not exists extraction_confidence numeric;
alter table public.submissions add column if not exists file_path text;
update public.submissions set extracted_text = coalesce(extracted_text, essay) where extracted_text is null;
update public.submissions set file_path = coalesce(file_path, submission_storage_path) where file_path is null;
-- relax the v1 status CHECK so v2 statuses (grading/graded/needs_review/grade_error) are allowed
alter table public.submissions drop constraint if exists submissions_status_check;

-- ── assignments: instructions fallback (backfilled from v1) ──
alter table public.assignments add column if not exists instructions text;
update public.assignments set instructions = coalesce(instructions, prompt_instructions, rubric_text, description)
  where instructions is null;

-- ── rubrics: structured link the grader looks up (null is fine → falls back to instructions) ──
alter table public.rubrics add column if not exists assignment_id uuid references public.assignments(id) on delete cascade;
alter table public.rubrics add column if not exists total_points numeric default 100;

-- ── new v2 tables ──
create table if not exists public.rubric_criteria (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  rubric_id uuid not null references public.rubrics(id) on delete cascade,
  name text not null, weight numeric not null default 1, max_score numeric not null default 10,
  level_descriptors jsonb not null default '{}'::jsonb, sort_order int not null default 0,
  created_at timestamptz not null default now());

create table if not exists public.submission_grades (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  schema_version text not null, overall_score numeric, overall_max numeric, letter text,
  confidence numeric, criteria jsonb not null default '[]'::jsonb, summary_feedback text,
  flags jsonb not null default '[]'::jsonb, model_id text, created_at timestamptz not null default now());
create index if not exists submission_grades_submission_id_idx on public.submission_grades(submission_id);

create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  submission_id uuid not null references public.submissions(id) on delete cascade,
  start_index int, end_index int, quote text not null, comment text not null,
  type text not null default 'suggestion', matched boolean not null default false,
  status text not null default 'pending', created_at timestamptz not null default now(),
  updated_at timestamptz not null default now());
create index if not exists annotations_submission_id_idx on public.annotations(submission_id);

create table if not exists public.annotation_edits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  annotation_id uuid not null references public.annotations(id) on delete cascade,
  action text not null, original jsonb, revised jsonb, created_at timestamptz not null default now());

create table if not exists public.teacher_style_profiles (
  user_id uuid primary key, style_summary text, style_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now());

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null, scope text not null,
  granted boolean not null, note text, created_at timestamptz not null default now());

create table if not exists public.access_audit_log (
  id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null,
  resource text not null, created_at timestamptz not null default now());

create table if not exists public.lms_credentials (
  id uuid primary key default gen_random_uuid(), user_id uuid not null, platform text not null default 'canvas',
  canvas_url text, vault_secret_id uuid, access_token_enc bytea, refresh_token_enc bytea,
  token_expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

drop trigger if exists annotations_updated_at on public.annotations;
create trigger annotations_updated_at before update on public.annotations for each row execute function public.set_updated_at();

-- ── RLS (owner-scoped; access_audit_log + lms_credentials are service-role only) ──
alter table public.rubric_criteria enable row level security;
alter table public.submission_grades enable row level security;
alter table public.annotations enable row level security;
alter table public.annotation_edits enable row level security;
alter table public.teacher_style_profiles enable row level security;
alter table public.consent_records enable row level security;
alter table public.access_audit_log enable row level security;
alter table public.lms_credentials enable row level security;

do $$ declare t text;
begin
  foreach t in array array['rubric_criteria','submission_grades','annotations','annotation_edits','consent_records'] loop
    execute format('drop policy if exists %1$s_sel on public.%1$s;', t);
    execute format('create policy %1$s_sel on public.%1$s for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists %1$s_ins on public.%1$s;', t);
    execute format('create policy %1$s_ins on public.%1$s for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists %1$s_upd on public.%1$s;', t);
    execute format('create policy %1$s_upd on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format('create policy %1$s_del on public.%1$s for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

drop policy if exists style_sel on public.teacher_style_profiles;
create policy style_sel on public.teacher_style_profiles for select using (auth.uid() = user_id);
drop policy if exists style_ins on public.teacher_style_profiles;
create policy style_ins on public.teacher_style_profiles for insert with check (auth.uid() = user_id);
drop policy if exists style_upd on public.teacher_style_profiles;
create policy style_upd on public.teacher_style_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── storage bucket for uploads (ingest-document) ──
insert into storage.buckets (id, name, public) values ('submissions','submissions', false) on conflict (id) do nothing;
drop policy if exists "submissions auth read" on storage.objects;
create policy "submissions auth read" on storage.objects for select to authenticated using (bucket_id = 'submissions');
drop policy if exists "submissions auth write" on storage.objects;
create policy "submissions auth write" on storage.objects for insert to authenticated with check (bucket_id = 'submissions');
drop policy if exists "submissions auth update" on storage.objects;
create policy "submissions auth update" on storage.objects for update to authenticated using (bucket_id = 'submissions');
