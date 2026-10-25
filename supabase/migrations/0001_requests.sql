-- CAA Portal, Brick 1: requests table and security rules.
-- Paste into Supabase > SQL Editor > New query > Run.

-- 1) The requests table: one row per client request.
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'declined', 'cancelled')),
  issue text not null
    check (issue in ('musty_smell', 'water_damage', 'post_remediation', 'air_quality', 'other')),
  size_band text not null
    check (size_band in ('under_2000', '2000_4000', '4000_6000', 'over_6000')),
  preferred_date date not null,
  preferred_time text not null check (preferred_time in ('10:00', '12:30')),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (phone ~ '^\+1[0-9]{10}$'),
  email text not null check (char_length(email) between 3 and 200),
  address text not null check (char_length(address) between 3 and 200),
  city text not null check (char_length(city) between 1 and 100),
  zip text not null check (zip ~ '^[0-9]{5}$'),
  notes text not null default '' check (char_length(notes) <= 1000),
  text_consent boolean not null,
  -- Internal only, never shown to the client:
  area text not null check (area in ('core', 'outside')),
  zone_id text,
  -- Hashed, never the raw IP. Used only to slow down spam.
  ip_hash text
);

create index requests_created_at_idx on public.requests (created_at desc);
create index requests_ip_hash_idx on public.requests (ip_hash, created_at desc);

-- 2) Who is allowed to read the list: only people in this table.
create table public.admin_users (
  email text primary key
);

-- 3) Lock both tables. Row level security on, and no public access at all.
alter table public.requests enable row level security;
alter table public.admin_users enable row level security;

revoke all on public.requests from anon, authenticated;
revoke all on public.admin_users from anon, authenticated;

-- 4) A small helper: "is the person logged in an admin?"
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 5) Admins (logged in) can read and update requests. Nobody else can do anything.
--    New requests are inserted only by the portal's server, never straight from a browser.
grant select, update on public.requests to authenticated;

create policy "admins read requests"
  on public.requests for select to authenticated
  using (public.is_admin());

create policy "admins update requests"
  on public.requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
