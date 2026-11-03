-- Client accounts: one per email address, so each person has a portal only they can open.
-- Sign-in is by emailed one-time link (same design as contractors, 0022). No passwords.
-- Needs 0023 (businesses). Only the server reads these tables.
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default public.default_business_id() references public.businesses(id),
  email text not null check (email = lower(email) and char_length(email) <= 200),
  name text check (name is null or char_length(name) <= 100),
  created_at timestamptz not null default now(),
  unique (business_id, email)
);
alter table public.clients enable row level security;
revoke all on public.clients from anon, authenticated;
grant select on public.clients to authenticated;
create policy "admins read clients" on public.clients for select to authenticated using (public.is_admin());

create table public.client_logins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.client_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.client_logins enable row level security;
alter table public.client_sessions enable row level security;
revoke all on public.client_logins from anon, authenticated;
revoke all on public.client_sessions from anon, authenticated;

alter table public.requests add column if not exists client_id uuid references public.clients(id);
create index if not exists requests_client_idx on public.requests (client_id) where client_id is not null;

-- Existing client jobs: one account per distinct email, then link the jobs.
insert into public.clients (business_id, email, name)
select distinct on (r.business_id, lower(r.email)) r.business_id, lower(r.email), r.name
from public.requests r
where r.source = 'client' and r.email is not null and r.business_id is not null
order by r.business_id, lower(r.email), r.created_at desc
on conflict (business_id, email) do nothing;

update public.requests r set client_id = c.id
from public.clients c
where r.client_id is null and r.source = 'client' and r.email is not null
  and c.business_id = r.business_id and c.email = lower(r.email);

-- Every new client job finds or makes its account, whichever way it was created.
create or replace function public.link_client() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.client_id is null and new.source = 'client' and new.email is not null then
    insert into public.clients (business_id, email, name)
    values (coalesce(new.business_id, public.default_business_id()), lower(new.email), new.name)
    on conflict (business_id, email) do nothing;
    select id into new.client_id from public.clients
      where business_id = coalesce(new.business_id, public.default_business_id()) and email = lower(new.email);
  end if;
  return new;
end $$;
drop trigger if exists requests_link_client on public.requests;
create trigger requests_link_client before insert on public.requests
  for each row execute function public.link_client();
