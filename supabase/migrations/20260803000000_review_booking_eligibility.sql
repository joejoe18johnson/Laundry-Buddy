-- Block reviews on cancelled, declined, or incomplete bookings.

create or replace function public.enforce_review_booking_complete()
returns trigger
language plpgsql
as $$
declare
  booking_row public.bookings%rowtype;
begin
  if new.booking_id is null then
    return new;
  end if;

  select * into booking_row
  from public.bookings
  where id = new.booking_id;

  if not found then
    raise exception 'Reviews require a valid booking';
  end if;

  if booking_row.request_status <> 'accepted' then
    raise exception 'Reviews are only allowed for completed accepted loads';
  end if;

  if booking_row.stage <> 'picked-up'
     and not (
       booking_row.host_pickup_confirmed_at is not null
       and booking_row.guest_pickup_confirmed_at is not null
     ) then
    raise exception 'Reviews are only allowed after pickup is complete';
  end if;

  return new;
end;
$$;

drop trigger if exists host_reviews_booking_complete_check on public.host_reviews;

create trigger host_reviews_booking_complete_check
  before insert on public.host_reviews
  for each row
  execute function public.enforce_review_booking_complete();
