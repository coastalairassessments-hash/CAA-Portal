alter table public.requests
  add column if not exists qb_invoice_id text,
  add column if not exists final_invoiced_at timestamptz;
