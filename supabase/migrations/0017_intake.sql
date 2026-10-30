-- Who is asking and what kind of property. Follow-up answers live in one flexible column.
alter table public.requests
  add column if not exists client_type text not null default 'homeowner'
    check (client_type in ('homeowner','manager','landlord','real_estate','contractor','business','other')),
  add column if not exists property_type text
    check (property_type is null or property_type in ('single_family','condo','multifamily','commercial','other')),
  add column if not exists company text
    check (company is null or char_length(company) <= 150),
  add column if not exists intake jsonb not null default '{}'::jsonb;
