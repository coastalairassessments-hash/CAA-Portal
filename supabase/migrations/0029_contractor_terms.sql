-- Contractor billing terms: who accepted which version and when, plus the marks the 25-day reminder and
-- the $250 administrative fee need so each happens once per invoice.
alter table public.contractors
  add column if not exists terms_token text not null default replace(gen_random_uuid()::text, '-', ''),
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists terms_sent_at timestamptz;
create unique index if not exists contractors_terms_token_idx on public.contractors (terms_token);

alter table public.requests
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists late_fee_added_at timestamptz;
