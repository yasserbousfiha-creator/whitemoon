-- Run once in Supabase SQL Editor after 003_wheel.sql.
-- The doctor the patient chose when booking from a doctor's profile (null when booking without one).

alter table public.bookings
  add column doctor text check (doctor is null or char_length(doctor) <= 100);
