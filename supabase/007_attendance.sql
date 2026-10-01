-- Run once in Supabase SQL Editor. Safe to run again.
-- Includes 006 (schedule blocks for the doctors added later), so 006 does not need to be run on its own.
alter table public.doctor_blocks drop constraint if exists doctor_blocks_doctor_check;
alter table public.doctor_blocks add constraint doctor_blocks_doctor_check check (doctor ~ '^[a-z-]+$');

-- Whether the patient turned up: null = not recorded yet. Written by the /admin dashboard (server key).
alter table public.bookings add column if not exists attendance text check (attendance in ('attended', 'no_show'));
alter table public.bookings add column if not exists attendance_at timestamptz;
