-- Humateck Supabase membership schema
-- Run this in Supabase SQL Editor.
-- Never expose the service_role key in website files.

create table if not exists public.free_trial_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  plan_code text not null default 'free7',
  country_limit int not null default 15,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.paid_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

create index if not exists idx_free_trial_members_user_status on public.free_trial_members(user_id, status, ends_at);
create index if not exists idx_paid_members_user_status on public.paid_members(user_id, status, ends_at);

alter table public.free_trial_members enable row level security;
alter table public.paid_members enable row level security;

-- Free trial: authenticated users can read only their own row.
drop policy if exists "free_trial_select_own" on public.free_trial_members;
create policy "free_trial_select_own" on public.free_trial_members
for select to authenticated
using (auth.uid() = user_id);

-- Free trial: authenticated users can create only their own first free-trial row.
drop policy if exists "free_trial_insert_own" on public.free_trial_members;
create policy "free_trial_insert_own" on public.free_trial_members
for insert to authenticated
with check (auth.uid() = user_id);

-- No public update/delete policy for free trials.
-- If a free-trial status must be changed, use Supabase dashboard or a secured server function.

-- Paid members: users can read only their own paid membership.
drop policy if exists "paid_members_select_own" on public.paid_members;
create policy "paid_members_select_own" on public.paid_members
for select to authenticated
using (auth.uid() = user_id);

-- No browser insert/update/delete policy for paid members.
-- Paid rows must be created by a secured webhook/server using the service_role key.
