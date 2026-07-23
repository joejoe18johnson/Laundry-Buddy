-- Cross-device chat: admin support replies + tighter support thread access + realtime

drop policy if exists "chat_messages_select_participant" on public.chat_messages;

create policy "chat_messages_select_participant" on public.chat_messages
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id::text = thread_id
        and (
          b.customer_id = auth.uid()
          or auth.uid() in (select host_user_id from public.hosts h where h.id = b.host_id)
        )
    )
    or thread_id = 'support:' || auth.uid()::text
    or (public.is_admin() and thread_id like 'support:%')
  );

drop policy if exists "chat_messages_insert_participant" on public.chat_messages;

create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()::text
    and (
      exists (
        select 1 from public.bookings b
        where b.id::text = thread_id
          and (
            b.customer_id = auth.uid()
            or auth.uid() in (select host_user_id from public.hosts h where h.id = b.host_id)
          )
      )
      or thread_id = 'support:' || auth.uid()::text
    )
  );

drop policy if exists "chat_messages_admin_support_insert" on public.chat_messages;

create policy "chat_messages_admin_support_insert" on public.chat_messages
  for insert with check (
    public.is_admin()
    and sender_id = auth.uid()::text
    and thread_id like 'support:%'
  );

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end $$;
