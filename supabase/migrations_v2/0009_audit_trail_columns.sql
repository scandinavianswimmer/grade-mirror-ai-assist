-- M51: training_data.title is a human label, separate from the data_type category that
-- "rename" was previously overwriting.
alter table public.training_data add column if not exists title text;

-- M50: preserve the original AI comment so the UI can show AI suggestion vs teacher's final
-- wording. Edits update annotations.comment; ai_comment is written once at grade time.
alter table public.annotations add column if not exists ai_comment text;

-- M69: snapshot the rubric used at grade time so later rubric edits don't rewrite history.
alter table public.submission_grades add column if not exists rubric_snapshot jsonb;
