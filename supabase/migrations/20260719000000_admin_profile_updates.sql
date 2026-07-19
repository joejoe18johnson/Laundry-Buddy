-- Admin verification support + inquiry chat policies
-- Run in Supabase SQL Editor if not using supabase db push.

-- Allow admin role in profiles enum (TypeScript already uses 'admin').
alter type public.app_role add value if not exists 'admin';

-- Security-definer helper avoids RLS recursion when checking admin status.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role::text = 'admin'
        or lower(coalesce(email, '')) = 'support@laundrybuddy.app'
      )
  );
$$;

drop policy if exists "profiles_update_admin" on public.profiles;

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- Merge a patch into another user's identity_verification (approve / reject / assign code).
create or replace function public.admin_patch_identity_verification(
  target_user_id uuid,
  patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_iv jsonb;
  merged_iv jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select coalesce(identity_verification, '{}'::jsonb)
  into current_iv
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'user not found';
  end if;

  merged_iv := current_iv || patch;

  update public.profiles
  set identity_verification = merged_iv,
      updated_at = now()
  where id = target_user_id;

  return merged_iv;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_patch_identity_verification(uuid, jsonb) to authenticated;

-- Pre-booking inquiry threads: inquiry:{guest_user_id}:{host_user_id}
drop policy if exists "chat_messages_select_inquiry" on public.chat_messages;
drop policy if exists "chat_messages_insert_inquiry" on public.chat_messages;

create policy "chat_messages_select_inquiry" on public.chat_messages
  for select using (
    thread_id like 'inquiry:' || auth.uid()::text || ':%'
    or thread_id like 'inquiry:%:' || auth.uid()::text
  );

create policy "chat_messages_insert_inquiry" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()::text
    and (
      thread_id like 'inquiry:' || auth.uid()::text || ':%'
      or thread_id like 'inquiry:%:' || auth.uid()::text
    )
  );
