-- Run once in Supabase SQL Editor after 004_doctor.sql.
-- Doctor schedule: admin-closed days/slots, and one booking per doctor per slot.

-- A closed whole day (start_time null) or one 30-minute slot, for one doctor or for everyone (doctor = 'all').
create table public.doctor_blocks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  doctor text not null check (doctor in ('all', 'yasmine', 'souad', 'fatima-alzahraa', 'ahmed-althubaiti')),
  date date not null,
  start_time time,
  note text check (note is null or char_length(note) <= 200),
  created_by uuid references auth.users on delete set null
);

create unique index doctor_blocks_day_idx on public.doctor_blocks (doctor, date) where start_time is null;
create unique index doctor_blocks_slot_idx on public.doctor_blocks (doctor, date, start_time) where start_time is not null;

alter table public.doctor_blocks enable row level security;
revoke all on public.doctor_blocks from anon, authenticated;
grant select, insert, delete on public.doctor_blocks to service_role;

-- Which doctor a booking is for (the display name stays in bookings.doctor).
alter table public.bookings add column doctor_id text;

-- A doctor can't be booked twice for the same slot (cancelled bookings free it again).
create unique index bookings_doctor_slot_idx on public.bookings (doctor_id, appointment_date, appointment_time)
  where doctor_id is not null and status <> 'cancelled';
