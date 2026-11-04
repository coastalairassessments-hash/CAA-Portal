-- One app, many businesses. CAA is the first. Every job and contractor belongs to a business,
-- so a second company (white-label) can run on the same system later with its own data.
-- Who a client is (homeowner, manager, agent...) already lives in requests.client_type (0017).
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name text not null check (char_length(name) between 2 and 100),
  created_at timestamptz not null default now()
);
alter table public.businesses enable row level security;
revoke all on public.businesses from anon, authenticated;
grant select on public.businesses to authenticated;
create policy "admins read businesses" on public.businesses
  for select to authenticated using (public.is_admin());

insert into public.businesses (slug, name)
values ('caa', 'Coastal Air Assessments')
on conflict (slug) do nothing;

alter table public.requests
  add column if not exists business_id uuid references public.businesses(id);
alter table public.contractors
  add column if not exists business_id uuid references public.businesses(id);

update public.requests set business_id = (select id from public.businesses where slug = 'caa') where business_id is null;
update public.contractors set business_id = (select id from public.businesses where slug = 'caa') where business_id is null;

-- New rows land on CAA until a second business exists.
create or replace function public.default_business_id() returns uuid
  language sql stable as $$ select id from public.businesses where slug = 'caa' $$;
alter table public.requests alter column business_id set default public.default_business_id();
alter table public.contractors alter column business_id set default public.default_business_id();
