-- HIGH-7 de-id PRE-PASS opt-in flag (per teacher).
-- Adds a privacy_settings.deid_prepass column, DEFAULT FALSE so the optional model-based de-id
-- pre-pass is OFF for every existing and new teacher unless explicitly enabled. The grade-submission
-- function ALSO requires the DEID_PREPASS_ENABLED env flag, so this column is the per-teacher gate
-- on top of the global kill-switch. Forward-only + idempotent.
ALTER TABLE public.privacy_settings
  ADD COLUMN IF NOT EXISTS deid_prepass BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.privacy_settings.deid_prepass IS
  'Opt-in: run the model-based de-id pre-pass over essay bodies to mask residual free-text PII '
  '(other students, parents, hometowns, addresses, contact info) before grading. Costs an extra '
  'model call per grade. Requires the DEID_PREPASS_ENABLED env flag to also be on. Default false.';
