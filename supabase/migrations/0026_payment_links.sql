-- One-off payment links: a balance owed (for example from the old system) paid by card, tracked until paid.
create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 200),
  description text not null check (char_length(description) between 1 and 200),
  amount_cents integer not null check (amount_cents between 100 and 10000000),
  stripe_id text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payment_links enable row level security;
create policy "admins read links" on public.payment_links for select to authenticated using (public.is_admin());
create policy "admins add links" on public.payment_links for insert to authenticated with check (public.is_admin());
create policy "admins change links" on public.payment_links for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove links" on public.payment_links for delete to authenticated using (public.is_admin());
