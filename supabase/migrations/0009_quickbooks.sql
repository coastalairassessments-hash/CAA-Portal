-- One row: the QuickBooks connection. Only the server (service key) can read it.
create table if not exists public.qb_connection (
  id int primary key default 1 check (id = 1),
  realm_id text not null,
  access_token text not null,
  refresh_token text not null,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.qb_connection enable row level security;
-- No policies on purpose: logged-in users and the public cannot see tokens.
