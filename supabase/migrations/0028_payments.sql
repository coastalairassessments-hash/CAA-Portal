-- Every card payment that cleared, one row each, for bookkeeping and payout matching.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  stripe_id text not null unique,
  kind text not null check (kind in ('deposit', 'balance', 'link')),
  request_id uuid references public.requests(id) on delete set null,
  link_id uuid references public.payment_links(id) on delete set null,
  name text not null default '',
  amount_cents integer not null check (amount_cents >= 0),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists payments_paid_at_idx on public.payments (paid_at desc);
alter table public.payments enable row level security;
create policy "admins read payments" on public.payments for select to authenticated using (public.is_admin());
create policy "admins add payments" on public.payments for insert to authenticated with check (public.is_admin());
