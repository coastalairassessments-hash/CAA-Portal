-- Remembers that the client was told "your report is ready, pay your final invoice to unlock it".
alter table public.requests
  add column if not exists report_locked_emailed_at timestamptz;
