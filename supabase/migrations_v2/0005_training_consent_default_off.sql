-- Training on teacher/student content must be OPT-IN (C10). Default the column OFF and
-- flip any rows that were created under the old default-ON behavior without an explicit choice.
-- (Existing teachers can re-enable it in Profile → Privacy.)
alter table public.privacy_settings alter column allow_training_on_content set default false;
