-- A saved link may wait without an email until it is sent.
alter table public.payment_links alter column email drop not null;
alter table public.payment_links drop constraint if exists payment_links_email_check;
alter table public.payment_links add constraint payment_links_email_check check (email is null or char_length(email) between 3 and 200);

-- The unpaid balances moving over from Jobber, saved and not sent.
insert into public.payment_links (name, email, description, amount_cents) values
('Reid Price', 'reid.price@homeys.com', 'Invoice #12978, PRV, Oct 16', 60000),
('Reid Price', 'reid.price@homeys.com', 'Invoice #12979, PRV, Oct 16', 35000),
('Reid Price', 'reid.price@homeys.com', 'Invoice #12987, Limited Assessment, Oct 24', 68500),
('Tony Fernandez', 'corp@jupiterrver.com', 'Invoice #12962, PRV, Sep 29', 57500),
('Vault Insurance', 'greg.jumps@vault.insurance', 'Invoice #12965, Third-Party Water Category Evaluation, Sep 29', 103500),
('Fides Restoration', 'chance@fidesrestoration.com', 'Invoice #12918, Fire Assessment, Aug 10', 350000),
('Fides Restoration', 'chance@fidesrestoration.com', 'Invoice #12993, Smoke Byproducts Inspection, Oct 29', 250000),
('Laura Baltadano', null, 'Invoice #12995, IAQ Assessment, Nov 4 (remaining balance)', 23500),
('Leonela Waltrick', null, 'Invoice #12985, IAQ Assessment, Oct 24 (remaining balance)', 23500);
