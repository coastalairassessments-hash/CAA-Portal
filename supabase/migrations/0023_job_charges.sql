-- Charges on a job: materials (such as lab samples), a trip fee, or anything else. Shown on the balance.
-- Also: a "trip only" job (not ready or no access, billed the trip fee instead of the full price),
-- and a reference or PO number the invoice can carry.

create table if not exists public.job_charges (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  kind text not null default 'material' check (kind in ('material', 'trip', 'other')),
  description text not null check (char_length(description) between 1 and 120),
  qty numeric(7,2) not null default 1 check (qty > 0 and qty <= 1000),
  unit_cents integer not null check (unit_cents >= 0 and unit_cents <= 10000000),
  created_at timestamptz not null default now()
);
create index if not exists job_charges_request_idx on public.job_charges (request_id, created_at);

alter table public.job_charges enable row level security;
create policy "admins read charges" on public.job_charges for select to authenticated using (public.is_admin());
create policy "admins add charges" on public.job_charges for insert to authenticated with check (public.is_admin());
create policy "admins remove charges" on public.job_charges for delete to authenticated using (public.is_admin());

alter table public.requests
  add column if not exists trip_only boolean not null default false,
  add column if not exists reference text check (reference is null or char_length(reference) <= 80);
