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

-- No direct public table access. Frontend uses RPC functions below.
drop policy if exists "free_trial_public_select" on public.free_trial_members;
drop policy if exists "free_trial_public_insert" on public.free_trial_members;
drop policy if exists "paid_members_public_select" on public.paid_members;

create or replace function public.humateck_get_membership_by_email(p_email text)
returns table(
  email text,
  plan text,
  country_limit int,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  kind text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select pm.email, pm.plan_code, pm.country_limit, pm.starts_at, pm.ends_at, pm.status, 'paid'::text
  from public.paid_members pm
  where lower(pm.email) = lower(trim(p_email))
    and pm.status = 'active'
    and pm.ends_at > now()
  order by pm.ends_at desc
  limit 1;

  if not found then
    return query
    select ft.email, ft.plan_code, ft.country_limit, ft.starts_at, ft.ends_at, ft.status, 'free_trial'::text
    from public.free_trial_members ft
    where lower(ft.email) = lower(trim(p_email))
      and ft.status = 'active'
      and ft.ends_at > now()
    order by ft.ends_at desc
    limit 1;
  end if;
end;
$$;

create or replace function public.humateck_claim_free_trial(p_email text)
returns table(
  email text,
  plan text,
  country_limit int,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  kind text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_now timestamptz := now();
  v_end timestamptz := now() + interval '7 days';
begin
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'Invalid email.';
  end if;

  if exists (select 1 from public.free_trial_members ft where lower(ft.email) = v_email) then
    raise exception 'This email has already used the 7-Day Free Trial.';
  end if;

  insert into public.free_trial_members(email, plan_code, country_limit, status, starts_at, ends_at)
  values (v_email, 'free7', 15, 'active', v_now, v_end);

  return query
  select ft.email, ft.plan_code, ft.country_limit, ft.starts_at, ft.ends_at, ft.status, 'free_trial'::text
  from public.free_trial_members ft
  where lower(ft.email) = v_email
  limit 1;
end;
$$;

grant execute on function public.humateck_get_membership_by_email(text) to anon, authenticated;
grant execute on function public.humateck_claim_free_trial(text) to anon, authenticated;

-- Paid rows must be created by payment webhook/server or administrator.
-- Free-trial rows are created only through humateck_claim_free_trial().
