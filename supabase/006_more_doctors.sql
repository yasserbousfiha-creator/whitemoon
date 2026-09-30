-- Run once in Supabase SQL Editor after 005_doctor_schedule.sql.
-- Lets the /admin schedule tab close days/slots for doctors added after 005 (the doctor list lives in the app code).
alter table public.doctor_blocks drop constraint if exists doctor_blocks_doctor_check;
alter table public.doctor_blocks add constraint doctor_blocks_doctor_check check (doctor ~ '^[a-z-]+$');
