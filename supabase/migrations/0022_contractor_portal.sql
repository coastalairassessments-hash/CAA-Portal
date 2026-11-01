-- Contractor login: invite-only, by emailed link. Cory adds a contractor's email; they sign in and schedule PRVs.
alter table public.contractors
  add column if not exists email text check (email is null or char_length(email) <= 200),
  add column if not exists phone text check (phone is null or char_length(phone) <= 40),
  add column if not exists portal_active boolean not null default true;
create unique index if not exists contractors_email_idx on public.contractors (lower(email)) where email is not null;

-- One-time sign-in links (15 minutes) and sessions (30 days). Only the server reads these. Tokens are stored hashed.
create table public.contractor_logins (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.contractor_sessions (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.contractor_logins enable row level security;
alter table public.contractor_sessions enable row level security;
revoke all on public.contractor_logins from anon, authenticated;
revoke all on public.contractor_sessions from anon, authenticated;
