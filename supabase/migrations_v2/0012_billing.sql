-- Phase 12: Billing (Stripe).
-- BILL-01/BILL-02: persist a teacher's Stripe subscription so the app can gate by plan.
-- Additive + idempotent (safe to re-run): create table if not exists, add column if not exists,
-- drop policy if exists then create. The webhook (service role) is the ONLY writer; teachers
-- read their own row to drive plan/usage gating in the UI.

create table if not exists public.subscriptions (
  user_id                uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  -- 'free' | 'pro' | 'enterprise' — mirrors the users.plan vocabulary (0001 baseline).
  plan                   text not null default 'free',
  -- Stripe subscription status: active | trialing | past_due | canceled | incomplete | ...
  status                 text not null default 'inactive',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Idempotent column adds (in case an earlier partial version of this table exists in cloud).
alter table public.subscriptions add column if not exists stripe_customer_id     text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
alter table public.subscriptions add column if not exists plan                   text not null default 'free';
alter table public.subscriptions add column if not exists status                 text not null default 'inactive';
alter table public.subscriptions add column if not exists current_period_end     timestamptz;
alter table public.subscriptions add column if not exists created_at             timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at             timestamptz not null default now();

-- Fast lookups from the webhook by Stripe identifiers.
create index if not exists subscriptions_customer_idx     on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_subscription_idx on public.subscriptions(stripe_subscription_id);

-- updated_at trigger (set_updated_at() is defined in 0001 baseline). Idempotent re-create.
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- RLS: a teacher reads ONLY their own subscription row. There is NO client write policy —
-- inserts/updates/deletes happen exclusively via the service-role webhook (adminClient),
-- which bypasses RLS. This mirrors the privileged-column pattern on public.users (0001).
alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (auth.uid() = user_id);
