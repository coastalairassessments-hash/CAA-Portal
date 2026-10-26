-- Booking policy agreement, and cancellation / refund tracking.
alter table public.requests
  add column if not exists policy_version text,
  add column if not exists policy_accepted_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_refund boolean,
  add column if not exists refunded_at timestamptz;
