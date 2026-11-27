-- Late-cancel rule (policy v3): a record of what the client was shown and chose, so any dispute can be answered.
alter table public.requests
  add column if not exists late_reschedules integer not null default 0,
  add column if not exists late_reschedule_at timestamptz,
  add column if not exists cancel_option text,
  add column if not exists cancel_hours_before numeric,
  add column if not exists cancel_fee_cents integer,
  add column if not exists cancel_refund_cents integer,
  add column if not exists cancel_policy_version text,
  add column if not exists cancel_confirmed_at timestamptz,
  add column if not exists deposit_policy_seen_at timestamptz,
  add column if not exists deposit_policy_version text;

alter table public.requests
  drop constraint if exists requests_cancel_option_check;
alter table public.requests
  add constraint requests_cancel_option_check check (cancel_option is null or cancel_option in ('free', 'late_fee', 'inspector', 'unpaid'));
