-- Run once in Supabase SQL Editor. Safe to run again.
-- Bookings for the departments added at the Shahar branch: gynecology, pediatrics, general medicine.
alter table public.bookings drop constraint if exists bookings_service_check;
alter table public.bookings add constraint bookings_service_check
  check (service in ('dentistry', 'derma', 'laser', 'gynecology', 'pediatrics', 'general'));
