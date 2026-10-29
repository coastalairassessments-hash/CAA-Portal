-- Time away: days or start times Cory closes. Clients cannot pick them, and a visit cannot be booked into them.
create table public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  slot text not null check (slot in ('10:00', '12:30', 'all')),
  note text,
  created_at timestamptz not null default now(),
  unique (day, slot)
);

alter table public.time_blocks enable row level security;
create policy "admins read blocks" on public.time_blocks
  for select to authenticated using (public.is_admin());
create policy "admins add blocks" on public.time_blocks
  for insert to authenticated with check (public.is_admin());
create policy "admins remove blocks" on public.time_blocks
  for delete to authenticated using (public.is_admin());

-- A visit cannot become confirmed on a closed day or start time (same error as a double booking).
create or replace function public.check_time_blocks() returns trigger
language plpgsql as $$
begin
  if new.status = 'confirmed' and new.confirmed_date is not null and exists (
    select 1 from public.time_blocks b
    where b.day = new.confirmed_date
      and (b.slot = 'all' or b.slot = new.confirmed_time or new.block_hours > 2)
  ) then
    raise exception 'That time is closed' using errcode = '23P01';
  end if;
  return new;
end $$;

create trigger requests_check_time_blocks
  before insert or update of status, confirmed_date, confirmed_time, block_hours on public.requests
  for each row execute function public.check_time_blocks();
