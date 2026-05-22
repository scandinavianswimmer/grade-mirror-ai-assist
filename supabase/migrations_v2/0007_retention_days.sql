-- Persist the data-retention choice so cleanup jobs can honor it (H32).
-- null = keep forever; otherwise delete eligible data older than N days.
alter table public.privacy_settings add column if not exists retention_days integer;
