-- Remember when a client email did not go out, so the job can show it until Cory clears it.
alter table public.requests add column if not exists email_failed_at timestamptz;
alter table public.requests add column if not exists email_failed_reason text;
