-- Referral thank-you: a phone number per partner, and a record of who has been thanked for which job.
alter table public.referral_partners
  add column if not exists phone text check (phone is null or phone ~ '^[0-9]{10,15}$');
alter table public.requests
  add column if not exists referral_thanked_at timestamptz;

create policy "admins edit partners" on public.referral_partners
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
