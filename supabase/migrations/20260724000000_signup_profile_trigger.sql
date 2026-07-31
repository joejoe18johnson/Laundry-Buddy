-- Safer sign-up profile creation: normalize phone, block duplicate phone/email before insert,
-- and upsert profile details when the auth trigger re-runs.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_phone text;
  normalized_email text;
  user_role public.app_role;
  raw_phone text;
begin
  raw_phone := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  normalized_phone := case
    when raw_phone is null then null
    when regexp_replace(raw_phone, '\D', '', 'g') like '501%'
      then regexp_replace(raw_phone, '\D', '', 'g')
    else '501' || regexp_replace(raw_phone, '\D', '', 'g')
  end;

  normalized_email := lower(trim(coalesce(
    nullif(new.raw_user_meta_data ->> 'login_email', ''),
    new.email,
    ''
  )));

  user_role := coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'customer');

  if coalesce(normalized_phone, '') <> '' then
    if exists (select 1 from public.profiles p where p.phone = normalized_phone) then
      raise exception 'Phone number already registered'
        using errcode = '23505';
    end if;
  end if;

  if normalized_email <> '' then
    if exists (
      select 1
      from public.profiles p
      where lower(trim(coalesce(p.email, ''))) = normalized_email
    ) then
      raise exception 'Email already registered'
        using errcode = '23505';
    end if;
  end if;

  insert into public.profiles (id, name, phone, email, role, identity_verification)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Laundry Buddy user'),
    nullif(normalized_phone, ''),
    nullif(normalized_email, ''),
    user_role,
    '{}'::jsonb
  )
  on conflict (id) do update set
    name = excluded.name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = coalesce(excluded.email, public.profiles.email),
    role = excluded.role;

  return new;
end;
$$;
