-- The client directory: imported once from Jobber and QuickBooks exports, searched in the Clients tab.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null check (char_length(name) between 1 and 200),
  phone text,
  phone_digits text,
  email text,
  address text,
  source text not null default 'import',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists clients_name_idx on public.clients (lower(name));

alter table public.clients enable row level security;
create policy "admins read clients" on public.clients for select to authenticated using (public.is_admin());
create policy "admins add clients" on public.clients for insert to authenticated with check (public.is_admin());
create policy "admins change clients" on public.clients for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove clients" on public.clients for delete to authenticated using (public.is_admin());
