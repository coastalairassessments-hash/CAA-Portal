-- Phones that get alerts. Only Cory can add or remove one; the server reads them with the service key.
create table public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "admins add phones" on public.push_subscriptions
  for insert to authenticated with check (public.is_admin());
create policy "admins read phones" on public.push_subscriptions
  for select to authenticated using (public.is_admin());
create policy "admins remove phones" on public.push_subscriptions
  for delete to authenticated using (public.is_admin());
