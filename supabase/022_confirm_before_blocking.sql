-- A booking only reserves (blocks) a doctor's slot once reception has confirmed it — until then it is a request, and
-- the time stays open for others in the booking form (user's choice 2026-10-31). Before this, any non-cancelled
-- booking blocked the slot the moment it was submitted.
--
-- So the slot's uniqueness now applies to CONFIRMED bookings only: at most one confirmed booking per doctor slot,
-- while any number of 'new'/'contacted' requests may share that time until one is confirmed. Run once in Supabase.

drop index if exists public.bookings_doctor_slot_idx;

create unique index bookings_doctor_slot_idx on public.bookings (doctor_id, appointment_date, appointment_time)
  where doctor_id is not null and status = 'confirmed';
