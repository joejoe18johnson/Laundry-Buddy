-- One review per guest per completed booking.
create unique index if not exists host_reviews_author_booking_unique_idx
  on public.host_reviews (author_id, booking_id)
  where author_id is not null and booking_id is not null;
