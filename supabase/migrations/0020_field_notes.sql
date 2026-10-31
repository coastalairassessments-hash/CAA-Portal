-- Field notes: notes, photos and a sample log for each job. Only admins can see or change them.

create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

create table public.job_samples (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  location text check (location is null or char_length(location) <= 200),
  kind text not null default 'air' check (kind in ('air', 'surface', 'bulk', 'water', 'other')),
  lab_ref text check (lab_ref is null or char_length(lab_ref) <= 80),
  created_at timestamptz not null default now()
);

create index job_notes_request_idx on public.job_notes (request_id, created_at);
create index job_photos_request_idx on public.job_photos (request_id, created_at);
create index job_samples_request_idx on public.job_samples (request_id, created_at);

alter table public.job_notes enable row level security;
alter table public.job_photos enable row level security;
alter table public.job_samples enable row level security;

create policy "admins read notes" on public.job_notes for select to authenticated using (public.is_admin());
create policy "admins add notes" on public.job_notes for insert to authenticated with check (public.is_admin());
create policy "admins remove notes" on public.job_notes for delete to authenticated using (public.is_admin());

create policy "admins read photos" on public.job_photos for select to authenticated using (public.is_admin());
create policy "admins add photos" on public.job_photos for insert to authenticated with check (public.is_admin());
create policy "admins remove photos" on public.job_photos for delete to authenticated using (public.is_admin());

create policy "admins read samples" on public.job_samples for select to authenticated using (public.is_admin());
create policy "admins add samples" on public.job_samples for insert to authenticated with check (public.is_admin());
create policy "admins remove samples" on public.job_samples for delete to authenticated using (public.is_admin());

-- A private place for the photo files. Nobody can open them without a signed-in admin.
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

create policy "admins read job photo files" on storage.objects
  for select to authenticated using (bucket_id = 'job-photos' and public.is_admin());
create policy "admins add job photo files" on storage.objects
  for insert to authenticated with check (bucket_id = 'job-photos' and public.is_admin());
create policy "admins remove job photo files" on storage.objects
  for delete to authenticated using (bucket_id = 'job-photos' and public.is_admin());

-- Unpaid invoice reminders (day 3, 7, 14): how many were sent and when the last one went.
alter table public.requests
  add column if not exists invoice_reminders int not null default 0,
  add column if not exists invoice_reminded_at timestamptz;
