-- Run once in Supabase SQL Editor (after 010_doctor_bios.sql). Safe to run again.
-- Offers: added from /admin → "العروض", shown on the site (an "Offers" section and a popup on branch pages) and
-- bookable: a booking made from an offer keeps the offer's title.

create table if not exists public.offers (
  id bigint generated always as identity primary key,
  title_ar text not null check (char_length(title_ar) between 2 and 120),
  title_en text not null default '' check (char_length(title_en) <= 120),
  description_ar text not null default '' check (char_length(description_ar) <= 1000),
  description_en text not null default '' check (char_length(description_en) <= 1000),
  image text,
  price_before numeric(10, 2) check (price_before >= 0),
  price_after numeric(10, 2) check (price_after >= 0),
  -- Where the offer applies; empty = every branch.
  branches text[] not null default '{}' check (branches <@ array['khamseen', 'shahar', 'wisam']),
  service text not null check (service in ('dentistry', 'derma', 'laser', 'gynecology', 'pediatrics', 'general')),
  -- Last day of the offer (Riyadh), included; null = no end date.
  ends_on date,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

-- The public site reads visible offers with the publishable key (expired ones are filtered in the code too);
-- /admin writes with the server key.
alter table public.offers enable row level security;
drop policy if exists "anyone reads visible offers" on public.offers;
create policy "anyone reads visible offers" on public.offers for select to anon, authenticated
  using (active and (ends_on is null or ends_on >= (now() at time zone 'Asia/Riyadh')::date));
revoke all on public.offers from anon, authenticated;
grant select on public.offers to anon, authenticated;
grant select, insert, update, delete on public.offers to service_role;

-- The offer a booking was made from (its title is kept even if the offer is later edited or removed).
alter table public.bookings add column if not exists offer_id bigint references public.offers on delete set null;
alter table public.bookings add column if not exists offer text check (char_length(offer) <= 120);

-- Offer images live in the same public bucket as the doctors' photos, under offers/.
insert into storage.buckets (id, name, public) values ('doctors', 'doctors', true) on conflict (id) do nothing;
