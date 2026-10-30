-- A private link for each client: /booking/<token>. The token cannot be guessed.
alter table public.requests
  add column public_token text not null unique default replace(gen_random_uuid()::text, '-', '');
