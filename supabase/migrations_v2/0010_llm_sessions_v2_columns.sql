-- B3: grade-submission logs richer LLM session metadata than the v1 llm_sessions table has.
-- The v1 table (migrations/…) only has status/input_data/output_data/timestamp/confidence_score,
-- so grade-submission's insert would throw on the live additive schema. Add the v2 columns
-- additively (the v1 generate-grading-feedback path keeps using the v1 columns).
alter table public.llm_sessions add column if not exists kind text;
alter table public.llm_sessions add column if not exists model_id text;
alter table public.llm_sessions add column if not exists input_tokens integer;
alter table public.llm_sessions add column if not exists output_tokens integer;
alter table public.llm_sessions add column if not exists cache_read_tokens integer;
alter table public.llm_sessions add column if not exists ok boolean;
