-- Brick: proof that the client agreed to the Mold Assessment and Sampling Terms.
alter table public.requests
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;
