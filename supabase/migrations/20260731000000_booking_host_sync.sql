-- Allow host participant updates via upsert fallback (guest insert policy unchanged).
-- Host saves use UPDATE-first in the app; this policy helps if upsert insert is attempted.

drop policy if exists "bookings_insert_customer" on public.bookings;

create policy "bookings_insert_customer" on public.bookings
  for insert with check (
    auth.uid() = customer_id
    or auth.uid() in (
      select host_user_id from public.hosts where id = host_id and host_user_id is not null
    )
  );
