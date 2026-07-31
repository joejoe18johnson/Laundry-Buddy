-- Realtime booking updates for cross-device guest/host sync.

do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end $$;
