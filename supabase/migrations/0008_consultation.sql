-- Adds the one-hour Consultation as a service type.
alter table public.requests drop constraint if exists requests_issue_check;
alter table public.requests
  add constraint requests_issue_check
  check (issue in ('musty_smell', 'water_damage', 'post_remediation', 'air_quality', 'consultation', 'other'));
