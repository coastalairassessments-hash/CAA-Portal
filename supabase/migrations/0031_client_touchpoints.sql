-- Client touchpoints: what-we-found note, private feedback before the Google review, one deposit nudge.
alter table public.requests
  add column if not exists visit_summary text,
  add column if not exists visit_summary_sent_at timestamptz,
  add column if not exists feedback_rating smallint,
  add column if not exists feedback_note text,
  add column if not exists feedback_at timestamptz,
  add column if not exists deposit_reminded_at timestamptz;

alter table public.requests
  drop constraint if exists requests_feedback_rating_check;
alter table public.requests
  add constraint requests_feedback_rating_check check (feedback_rating is null or feedback_rating between 1 and 5);
