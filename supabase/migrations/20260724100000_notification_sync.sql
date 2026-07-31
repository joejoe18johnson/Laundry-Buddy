-- Cross-device notifications: server inbox, push token storage, and send RPC.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_own" on public.push_tokens;
create policy "push_tokens_own" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.send_app_notification(
  target_user_id uuid,
  notification_title text,
  notification_body text,
  notification_link jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
  target_role public.app_role;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select role into target_role from public.profiles where id = target_user_id;
  if target_role is null then
    raise exception 'target user not found';
  end if;

  if auth.uid() <> target_user_id
     and not public.is_admin()
     and target_role <> 'admin' then
    raise exception 'not authorized';
  end if;

  insert into public.notifications (user_id, title, body, link)
  values (target_user_id, notification_title, notification_body, notification_link)
  returning id into notification_id;

  return notification_id;
end;
$$;

revoke all on function public.send_app_notification(uuid, text, text, jsonb) from public;
grant execute on function public.send_app_notification(uuid, text, text, jsonb) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;
