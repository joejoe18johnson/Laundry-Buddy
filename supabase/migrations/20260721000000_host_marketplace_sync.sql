-- Marketplace sync: online flag on public host listings + guest-readable host settings.

alter table public.hosts
  add column if not exists is_online boolean not null default false;

create index if not exists hosts_is_online_idx on public.hosts (is_online)
  where is_online = true;

-- Let signed-in guests load verified host settings (pricing, payments, availability).
drop policy if exists "host_settings_select_marketplace" on public.host_settings;

create policy "host_settings_select_marketplace" on public.host_settings
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1
      from public.profiles p
      where p.id = host_settings.host_user_id
        and p.role = 'host'
        and coalesce(p.identity_verification->>'status', '') = 'verified'
    )
  );
