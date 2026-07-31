-- Allow host/guest notifications and deliver Expo push when a row is inserted.

create extension if not exists pg_net with schema extensions;

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
  token_record record;
  push_body jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select role into target_role from public.profiles where id = target_user_id;
  if target_role is null then
    raise exception 'target user not found';
  end if;

  insert into public.notifications (user_id, title, body, link)
  values (target_user_id, notification_title, notification_body, notification_link)
  returning id into notification_id;

  push_body := jsonb_build_object(
    'title', notification_title,
    'body', notification_body,
    'sound', 'default',
    'priority', 'high',
    'data', coalesce(notification_link, '{}'::jsonb)
  );

  for token_record in
    select expo_push_token
    from public.push_tokens
    where user_id = target_user_id
  loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := push_body || jsonb_build_object('to', token_record.expo_push_token)
    );
  end loop;

  return notification_id;
end;
$$;

revoke all on function public.send_app_notification(uuid, text, text, jsonb) from public;
grant execute on function public.send_app_notification(uuid, text, text, jsonb) to authenticated;
