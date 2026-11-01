-- Report delivery: one PDF per job, private. The client opens it from their booking page once the final invoice is paid
-- (or when Cory taps Release now).
alter table public.requests
  add column if not exists report_path text,
  add column if not exists report_uploaded_at timestamptz,
  add column if not exists report_released_at timestamptz,
  add column if not exists report_emailed_at timestamptz;

insert into storage.buckets (id, name, public)
values ('job-reports', 'job-reports', false)
on conflict (id) do nothing;

create policy "admins read report files" on storage.objects
  for select to authenticated using (bucket_id = 'job-reports' and public.is_admin());
create policy "admins add report files" on storage.objects
  for insert to authenticated with check (bucket_id = 'job-reports' and public.is_admin());
create policy "admins remove report files" on storage.objects
  for delete to authenticated using (bucket_id = 'job-reports' and public.is_admin());

-- Referral partners: people who send Cory work. Each has a personal link (/request?ref=code).
create table public.referral_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  kind text not null default 'other' check (kind in ('realtor', 'contractor', 'plumber', 'past_client', 'other')),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  created_at timestamptz not null default now()
);
alter table public.referral_partners enable row level security;
create policy "admins read partners" on public.referral_partners for select to authenticated using (public.is_admin());
create policy "admins add partners" on public.referral_partners for insert to authenticated with check (public.is_admin());
create policy "admins remove partners" on public.referral_partners for delete to authenticated using (public.is_admin());

alter table public.requests
  add column if not exists referral_code text check (referral_code is null or referral_code ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');
create index if not exists requests_referral_idx on public.requests (referral_code) where referral_code is not null;
