-- Phone login and sign-up checks must work for anonymous users (before auth session).
-- RLS blocks direct profile reads; these SECURITY DEFINER helpers expose only what auth needs.

create or replace function public.normalize_belize_phone(raw_phone text)
returns text
language sql
immutable
as $$
  select case
    when regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g') like '501%'
      then regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g')
    else '501' || regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g')
  end;
$$;

create or replace function public.auth_email_for_phone(raw_phone text)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  normalized text;
  profile_email text;
begin
  normalized := public.normalize_belize_phone(raw_phone);
  if coalesce(regexp_replace(normalized, '\D', '', 'g'), '') = ''
     or length(regexp_replace(normalized, '\D', '', 'g')) < 7 then
    return null;
  end if;

  select lower(trim(p.email))
    into profile_email
  from public.profiles p
  where p.phone = normalized
  limit 1;

  if profile_email is not null and profile_email <> '' then
    return profile_email;
  end if;

  return normalized || '@phone.laundrybuddy.app';
end;
$$;

create or replace function public.profile_phone_in_use(raw_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  normalized text;
begin
  normalized := public.normalize_belize_phone(raw_phone);
  if coalesce(regexp_replace(normalized, '\D', '', 'g'), '') = '' then
    return false;
  end if;

  return exists (
    select 1 from public.profiles p where p.phone = normalized
  );
end;
$$;

create or replace function public.profile_email_in_use(raw_email text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(raw_email, '')));
  if normalized = '' then
    return false;
  end if;

  return exists (
    select 1 from public.profiles p where lower(trim(coalesce(p.email, ''))) = normalized
  );
end;
$$;

revoke all on function public.normalize_belize_phone(text) from public;
revoke all on function public.auth_email_for_phone(text) from public;
revoke all on function public.profile_phone_in_use(text) from public;
revoke all on function public.profile_email_in_use(text) from public;

grant execute on function public.normalize_belize_phone(text) to anon, authenticated;
grant execute on function public.auth_email_for_phone(text) to anon, authenticated;
grant execute on function public.profile_phone_in_use(text) to anon, authenticated;
grant execute on function public.profile_email_in_use(text) to anon, authenticated;
