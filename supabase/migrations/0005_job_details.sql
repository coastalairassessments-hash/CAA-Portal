-- Step 2a: time on site, lab, money, client extras. Run after 0004.
-- Paste into Supabase > SQL Editor > New query > Run.
alter table public.requests
  add column if not exists how_heard text
    check (how_heard in ('google', 'referral', 'contractor', 'social', 'other')),
  add column if not exists qb_customer_id text,
  add column if not exists repeat_client boolean not null default false,
  -- time on site
  add column if not exists arrived_at timestamptz,
  add column if not exists left_at timestamptz,
  -- lab
  add column if not exists lab_name text,
  add column if not exists lab_samples integer check (lab_samples between 0 and 50),
  add column if not exists lab_coc text,
  add column if not exists lab_sent_on date,
  add column if not exists lab_results_on date,
  add column if not exists lab_cost_cents integer check (lab_cost_cents >= 0),
  -- money (typed in now, filled by QuickBooks later)
  add column if not exists deposit_invoice_no text,
  add column if not exists final_invoice_no text,
  add column if not exists extras_cents integer not null default 0 check (extras_cents >= 0),
  add column if not exists final_paid_at timestamptz,
  add column if not exists payment_method text
    check (payment_method in ('card', 'check', 'cash', 'ach', 'other'));
