-- Guest search area + radius (synced across devices, default 1 mile)

alter table public.profiles
  add column if not exists search_radius_miles smallint not null default 1,
  add column if not exists search_location_lat double precision,
  add column if not exists search_location_lng double precision,
  add column if not exists search_location_label text;

alter table public.profiles
  drop constraint if exists profiles_search_radius_miles_check;

alter table public.profiles
  add constraint profiles_search_radius_miles_check
  check (search_radius_miles in (1, 2, 3, 5));

comment on column public.profiles.search_radius_miles is 'Guest host search radius in miles (default 1).';
comment on column public.profiles.search_location_lat is 'Guest map/search center latitude.';
comment on column public.profiles.search_location_lng is 'Guest map/search center longitude.';
comment on column public.profiles.search_location_label is 'Guest search area label (town or "Your location").';
