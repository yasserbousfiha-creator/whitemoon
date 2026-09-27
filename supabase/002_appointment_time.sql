-- Run once in Supabase SQL Editor after schema.sql.
-- Adds the requested day/time, and a random per-booking token the patient's app uses to read back status and notes.

alter table public.bookings
  add column appointment_date date,
  add column appointment_time time,
  add column public_token uuid not null default gen_random_uuid();

create unique index bookings_public_token_idx on public.bookings (public_token);

-- The booking API and dashboard write through the server's secret key after checking the staff member's access.
grant select, insert, update on public.bookings to service_role;
grant select on public.staff to service_role;
