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
