-- Laundry Buddy — initial Supabase schema
-- Run in Supabase SQL Editor or via: supabase db push

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('customer', 'host');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_status as enum ('none', 'pending', 'verified', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_stage as enum ('got-bag', 'waiting', 'drying', 'ready', 'picked-up');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_method as enum ('cash', 'bank_transfer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('paid', 'pending');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sheets_option as enum ('own', 'buy', 'none');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.chat_message_kind as enum ('text', 'image', 'payment_proof', 'system');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text unique,
  email text unique,
  role public.app_role not null default 'customer',
  identity_verification jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_phone_idx on public.profiles (phone);
create index if not exists profiles_email_idx on public.profiles (email);

-- Auto-create profile row when auth user signs up (metadata from signUp options)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, email, role, identity_verification)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'Laundry Buddy user'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'login_email', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'customer'),
    '{}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Host listings
-- ---------------------------------------------------------------------------
create table if not exists public.hosts (
  id text primary key,
  host_user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  location text not null,
  district text,
  rating numeric(3, 2) not null default 5,
  review_count integer not null default 0,
  price numeric(10, 2) not null,
  slots_left integer not null default 1,
  turnaround_hours integer not null default 24,
  dryer_type text not null default 'Standard',
  has_generator boolean not null default false,
  folding_price numeric(10, 2),
  sheets_price numeric(10, 2),
  address text not null,
  gate_code text not null default '',
  photos jsonb not null default '[]'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  whatsapp text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  bio text,
  member_since text,
  loads_hosted integer not null default 0,
  response_time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hosts_host_user_id_idx on public.hosts (host_user_id);
create index if not exists hosts_location_idx on public.hosts (location);

-- ---------------------------------------------------------------------------
-- Host settings (JSON blob mirrors HostSettings in the app)
-- ---------------------------------------------------------------------------
create table if not exists public.host_settings (
  host_user_id uuid primary key references public.profiles (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bookings (guest + host lifecycle in one table)
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  host_id text not null references public.hosts (id) on delete restrict,
  host_name text not null,
  customer_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  location text not null,
  loads integer not null default 1,
  drop_off_time text not null,
  sheets_option public.sheets_option not null default 'own',
  notes text not null default '',
  stage public.booking_stage not null default 'got-bag',
  address text not null,
  gate_code text not null default '',
  stage_times jsonb not null default '{}'::jsonb,
  is_new boolean not null default true,
  completed_at timestamptz,
  payment_method public.payment_method,
  price_per_load numeric(10, 2),
  dry_price numeric(10, 2),
  folding_price numeric(10, 2),
  sheets_price numeric(10, 2),
  folding_service boolean not null default false,
  total_amount numeric(10, 2),
  payment_status public.payment_status,
  payment_proof_sent_at timestamptz,
  payment_proof_uri text,
  payment_requested_at timestamptz,
  request_status public.request_status not null default 'pending',
  load_photo_uri text,
  dry_photo_uri text,
  clothes_list jsonb not null default '[]'::jsonb,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_customer_id_idx on public.bookings (customer_id);
create index if not exists bookings_host_id_idx on public.bookings (host_id);
create index if not exists bookings_request_status_idx on public.bookings (request_status);
create index if not exists bookings_stage_idx on public.bookings (stage);

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_id text not null,
  sender_name text not null,
  sender_role text not null,
  text text,
  image_uri text,
  kind public.chat_message_kind not null default 'text',
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_id_idx on public.chat_messages (thread_id, created_at);

create table if not exists public.chat_read_receipts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  thread_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, thread_id)
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  link jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table if not exists public.host_reviews (
  id uuid primary key default gen_random_uuid(),
  host_id text not null references public.hosts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  booking_id uuid references public.bookings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists host_reviews_host_id_idx on public.host_reviews (host_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists hosts_set_updated_at on public.hosts;
create trigger hosts_set_updated_at before update on public.hosts
  for each row execute function public.set_updated_at();

drop trigger if exists host_settings_set_updated_at on public.host_settings;
create trigger host_settings_set_updated_at before update on public.host_settings
  for each row execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.hosts enable row level security;
alter table public.host_settings enable row level security;
alter table public.bookings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_read_receipts enable row level security;
alter table public.notifications enable row level security;
alter table public.host_reviews enable row level security;

-- Profiles: users read/update own row; anyone authenticated can read host profiles for listings
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Hosts: public read for marketplace; hosts manage their own listing
create policy "hosts_select_all" on public.hosts
  for select using (true);

create policy "hosts_insert_own" on public.hosts
  for insert with check (auth.uid() = host_user_id);

create policy "hosts_update_own" on public.hosts
  for update using (auth.uid() = host_user_id);

-- Host settings: owner only
create policy "host_settings_select_own" on public.host_settings
  for select using (auth.uid() = host_user_id);

create policy "host_settings_upsert_own" on public.host_settings
  for all using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);

-- Bookings: guest or host on the booking
create policy "bookings_select_participant" on public.bookings
  for select using (
    auth.uid() = customer_id
    or auth.uid() in (select host_user_id from public.hosts where id = host_id)
  );

create policy "bookings_insert_customer" on public.bookings
  for insert with check (auth.uid() = customer_id);

create policy "bookings_update_participant" on public.bookings
  for update using (
    auth.uid() = customer_id
    or auth.uid() in (select host_user_id from public.hosts where id = host_id)
  );

-- Chat: participants in a booking thread (thread_id = booking id)
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
    or thread_id like 'support:%'
  );

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

-- Read receipts: own rows only
create policy "chat_read_receipts_own" on public.chat_read_receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications: own rows only
create policy "notifications_own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reviews: public read; authors insert own
create policy "host_reviews_select_all" on public.host_reviews
  for select using (true);

create policy "host_reviews_insert_own" on public.host_reviews
  for insert with check (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- Storage buckets (run once in dashboard or via API)
-- ---------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values
--   ('load-photos', 'load-photos', false),
--   ('payment-proofs', 'payment-proofs', false),
--   ('id-documents', 'id-documents', false);
