-- Separate genuine teacher style exemplars from graded submissions stored in the same
-- table (H21/M49). Only rows flagged is_exemplar are used to personalize grading.
alter table public.training_examples add column if not exists is_exemplar boolean not null default false;

-- Existing ambiguous rows stay non-exemplar (conservative) so old graded submissions
-- don't silently pollute a teacher's style profile. Teachers can re-upload true exemplars.
