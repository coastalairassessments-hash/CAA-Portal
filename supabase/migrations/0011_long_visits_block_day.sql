-- A visit longer than 2 hours blocks the whole day. A 2-hour visit at 10:00 leaves 12:30 open.
alter table public.requests drop constraint if exists requests_no_double_booking;
alter table public.requests
  add constraint requests_no_double_booking
  exclude using gist (
    (tsrange(
      case when block_hours > 2
        then confirmed_date::timestamp
        else confirmed_date::timestamp
          + make_interval(
              hours => split_part(confirmed_time, ':', 1)::int,
              mins  => split_part(confirmed_time, ':', 2)::int)
      end,
      case when block_hours > 2
        then confirmed_date::timestamp + interval '1 day'
        else confirmed_date::timestamp
          + make_interval(
              hours => split_part(confirmed_time, ':', 1)::int + block_hours,
              mins  => split_part(confirmed_time, ':', 2)::int)
      end
    )) with &&
  )
  where (status = 'confirmed');
