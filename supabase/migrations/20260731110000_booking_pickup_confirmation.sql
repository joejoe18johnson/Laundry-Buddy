-- Persist dual pickup confirmations so guest and host devices stay in sync.

alter table public.bookings
  add column if not exists guest_pickup_confirmed_at timestamptz,
  add column if not exists host_pickup_confirmed_at timestamptz;
