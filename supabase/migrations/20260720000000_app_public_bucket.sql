-- Optional public bucket for hosted auth callback page (password reset / email links).
-- Upload supabase/public/auth-callback.html to this bucket if you set
-- EXPO_PUBLIC_AUTH_REDIRECT_URL to the public object URL.
-- By default the app uses the laundrybuddy://auth/callback deep link instead.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-public',
  'app-public',
  true,
  1048576,
  array['text/html', 'text/plain']
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read app-public objects" on storage.objects;
create policy "Public read app-public objects"
  on storage.objects
  for select
  to public
  using (bucket_id = 'app-public');

drop policy if exists "Authenticated upload app-public objects" on storage.objects;
create policy "Authenticated upload app-public objects"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'app-public');

drop policy if exists "Authenticated update app-public objects" on storage.objects;
create policy "Authenticated update app-public objects"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'app-public');
