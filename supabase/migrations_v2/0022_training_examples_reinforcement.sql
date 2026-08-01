-- Reconcile the legacy v1 training_examples shape with the clean v2 baseline.
--
-- The deployed v1 table uses a required `rubric` column, while the clean v2 baseline uses
-- nullable `rubric_text` plus a `source` discriminator. The application supports the additive
-- v1 -> v2 path, so make both rubric aliases available and nullable before reinforcement rows
-- (which are derived from reviewed feedback and may not have a standalone rubric) are inserted.

alter table public.training_examples add column if not exists rubric text;
alter table public.training_examples add column if not exists rubric_text text;
alter table public.training_examples add column if not exists source text;

update public.training_examples
set
  rubric = coalesce(rubric, rubric_text),
  rubric_text = coalesce(rubric_text, rubric),
  source = coalesce(source, 'upload')
where rubric is null or rubric_text is null or source is null;

alter table public.training_examples alter column rubric drop not null;
alter table public.training_examples alter column source set default 'upload';
alter table public.training_examples alter column source set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.training_examples'::regclass
      and conname = 'training_examples_source_check'
  ) then
    alter table public.training_examples
      add constraint training_examples_source_check
      check (source in ('upload', 'reinforcement'));
  end if;
end $$;

comment on column public.training_examples.rubric is
  'Legacy rubric alias retained for v1 frontend compatibility; nullable for reinforcement rows.';
comment on column public.training_examples.rubric_text is
  'Canonical free-text rubric alias for the additive v2 grading path.';
comment on column public.training_examples.source is
  'Origin of the example: explicit upload or consented reinforcement from reviewed feedback.';
