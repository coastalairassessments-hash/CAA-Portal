-- Brick 2: what Cory actually books when he confirms a request.
alter table public.requests
  add column if not exists confirmed_date date,
  add column if not exists confirmed_time text
    check (confirmed_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  add column if not exists block_hours integer
    check (block_hours between 1 and 8),
  add column if not exists confirmed_at timestamptz;
