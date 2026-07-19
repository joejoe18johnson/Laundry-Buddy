-- Allow admin users to approve/reject verification on any profile.
create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid() and admin.role = 'admin'
    )
  );

-- Pre-booking inquiry threads: inquiry:{guest_user_id}:{host_user_id}
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
