-- Step 1: offer first, hold the date only when the deposit is received.
-- Paste into Supabase > SQL Editor > New query > Run.

-- 1) A new stage: "offered" (deposit link sent, date NOT held yet).
alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests
  add constraint requests_status_check
  check (status in ('new', 'offered', 'confirmed', 'declined', 'cancelled'));

-- 2) Money and timing for each job.
alter table public.requests
  add column if not exists offered_at timestamptz,
  add column if not exists deposit_cents integer check (deposit_cents >= 0),
  add column if not exists deposit_paid_at timestamptz;

-- 3) First deposit wins. Two "confirmed" (deposit paid) jobs can never overlap.
--    The database itself refuses the second one.
alter table public.requests
  add constraint requests_no_double_booking
  exclude using gist (
    (tsrange(
      confirmed_date::timestamp
        + make_interval(
            hours => split_part(confirmed_time, ':', 1)::int,
            mins  => split_part(confirmed_time, ':', 2)::int),
      confirmed_date::timestamp
        + make_interval(
            hours => split_part(confirmed_time, ':', 1)::int + block_hours,
            mins  => split_part(confirmed_time, ':', 2)::int)
    )) with &&
  )
  where (status = 'confirmed');
