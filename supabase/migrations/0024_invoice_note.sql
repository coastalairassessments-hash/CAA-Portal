-- A note that prints on the invoice (separate from the private job notes, which hold gate codes and so on).
alter table public.requests add column if not exists invoice_note text check (char_length(invoice_note) <= 500);
