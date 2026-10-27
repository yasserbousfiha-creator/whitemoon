-- Run once in Supabase SQL Editor (after 019_doctor_names.sql). Safe to run again.
-- Who did what on a booking, shown on its card in /admin → الحجوزات:
--   status_by / status_at   — who last changed the status (تم التواصل، مؤكد، ملغي…) and when;
--   attendance_by           — who recorded حضر / لم يحضر (attendance_at already exists, 007_attendance.sql).
-- updated_by keeps meaning "the last change of any kind" (a note included). Written by the server only.

alter table public.bookings add column if not exists status_by uuid references auth.users on delete set null;
alter table public.bookings add column if not exists status_at timestamptz;
alter table public.bookings add column if not exists attendance_by uuid references auth.users on delete set null;

notify pgrst, 'reload schema';
