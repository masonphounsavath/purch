-- ============================================================
-- Subly — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ── Profiles ────────────────────────────────────────────────
-- One profile per auth user, auto-created on sign-up.
create table public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text unique not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1)   -- e.g. "masonp" from masonp@unc.edu
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── Listings ────────────────────────────────────────────────
create table public.listings (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  title          text not null,
  description    text,
  rent           integer not null,           -- monthly rent in dollars
  available_from date not null,
  available_to   date not null,
  address        text not null,
  lat            numeric(9, 6),
  lng            numeric(9, 6),
  bedrooms       integer not null default 1,
  bathrooms      numeric(3, 1) not null default 1,
  is_furnished   boolean default false,
  photos         text[] default '{}',        -- Supabase Storage public URLs
  amenities      text[] default '{}',        -- e.g. ['Gym', 'Pool', 'Parking']
  is_active      boolean default true,
  created_at     timestamptz default now()
);

-- Index for common filter patterns
create index listings_user_id_idx   on public.listings(user_id);
create index listings_is_active_idx on public.listings(is_active);
create index listings_rent_idx      on public.listings(rent);
create index listings_dates_idx     on public.listings(available_from, available_to);


-- ── Messages ────────────────────────────────────────────────
create table public.messages (
  id           uuid default gen_random_uuid() primary key,
  listing_id   uuid references public.listings(id) on delete cascade not null,
  sender_id    uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  body         text not null,
  read_at      timestamptz,
  created_at   timestamptz default now()
);

create index messages_listing_idx   on public.messages(listing_id);
create index messages_sender_idx    on public.messages(sender_id);
create index messages_recipient_idx on public.messages(recipient_id);


-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.listings  enable row level security;
alter table public.messages  enable row level security;

-- Profiles
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Listings
create policy "Active listings are publicly readable"
  on public.listings for select using (is_active = true);

create policy "Users can read their own inactive listings"
  on public.listings for select using (auth.uid() = user_id);

create policy "Authenticated users can create listings"
  on public.listings for insert with check (auth.uid() = user_id);

create policy "Users can update their own listings"
  on public.listings for update using (auth.uid() = user_id);

create policy "Users can delete their own listings"
  on public.listings for delete using (auth.uid() = user_id);

-- Messages
create policy "Users can read their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can mark messages as read"
  on public.messages for update
  using (auth.uid() = recipient_id);


-- ── Storage: listing-photos bucket ──────────────────────────
-- Run separately in Storage settings or via this SQL:
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict do nothing;

create policy "Anyone can view listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "Authenticated users can upload listing photos"
  on storage.objects for insert
  with check (bucket_id = 'listing-photos' and auth.role() = 'authenticated');

create policy "Users can delete their own listing photos"
  on storage.objects for delete
  using (bucket_id = 'listing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
