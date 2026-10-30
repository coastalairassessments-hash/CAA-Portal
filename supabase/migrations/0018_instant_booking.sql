-- Instant booking: the client picks a time and pays the deposit right away.
alter table public.requests
  add column if not exists booking_mode text not null default 'request'
    check (booking_mode in ('request', 'instant')),
  add column if not exists qb_deposit_invoice_id text,
  add column if not exists pay_url text;
