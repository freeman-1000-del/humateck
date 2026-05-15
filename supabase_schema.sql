-- Humateck Supabase membership schema: email-based global plan flow
-- Run this in Supabase SQL Editor.
-- Never expose the service_role key in website files.

create table if not exists public.free_trial_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  plan_code text not null default 'free7',
  country_limit int not null default 15,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.paid_members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan_code text not null,
  country_limit int not null,
  status text not null default 'active',
  payment_provider text,
  provider_customer_id text,
  provider_subscription_id text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_free_trial_members_email_status on public.free_trial_members(email, status, ends_at);
create index if not exists idx_paid_members_email_status on public.paid_members(email, status, ends_at);

alter table public.free_trial_members enable row level security;
alter table public.paid_members enable row level security;

-- Frontend email verification requires public read by email and free trial insert.
-- For production, replace this with a secured Edge Function if stricter privacy is required.
drop policy if exists "free_trial_public_select" on public.free_trial_members;
create policy "free_trial_public_select" on public.free_trial_members
for select to anon, authenticated
using (true);

drop policy if exists "free_trial_public_insert" on public.free_trial_members;
create policy "free_trial_public_insert" on public.free_trial_members
for insert to anon, authenticated
with check (true);

drop policy if exists "paid_members_public_select" on public.paid_members;
create policy "paid_members_public_select" on public.paid_members
for select to anon, authenticated
using (true);

-- No public update/delete policy.
-- Paid rows must be created by payment webhook/server or administrator.
