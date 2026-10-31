-- A website booking is only a REQUEST, never a reservation. The booking form reads taken times from Kizen alone:
-- a request shows as taken only once reception actually books it in Kizen (user's choice 2026-10-31). So a website
-- booking — whatever its status, confirmed included — never blocks a slot, and several patients may request the same
-- time; reception sorts them out and books the chosen one in Kizen.
--
-- The doctor-slot unique index is therefore dropped: it used to stop two bookings sharing a slot, which would now
-- wrongly reject a second request. Run once in Supabase.

drop index if exists public.bookings_doctor_slot_idx;
