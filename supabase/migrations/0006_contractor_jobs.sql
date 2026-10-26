-- Contractor jobs: just the contractor's name and the job address.
-- Contact and billing details stay in QuickBooks.

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique check (char_length(name) between 1 and 100),
  qb_customer_id text
);
alter table public.contractors enable row level security;
revoke all on public.contractors from anon, authenticated;
grant select, insert, update on public.contractors to authenticated;
create policy "admins read contractors" on public.contractors
  for select to authenticated using (public.is_admin());
create policy "admins add contractors" on public.contractors
  for insert to authenticated with check (public.is_admin());
create policy "admins edit contractors" on public.contractors
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- A job can now come from a contractor, with no client contact details.
alter table public.requests
  add column if not exists source text not null default 'client'
    check (source in ('client', 'contractor')),
  add column if not exists contractor_id uuid references public.contractors(id),
  alter column phone drop not null,
  alter column email drop not null,
  alter column city drop not null,
  alter column zip drop not null,
  alter column size_band drop not null;

-- Admins can add jobs directly (contractor jobs and phone-in jobs).
grant insert on public.requests to authenticated;
create policy "admins add requests" on public.requests
  for insert to authenticated with check (public.is_admin());
