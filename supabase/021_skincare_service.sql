-- Run once in Supabase SQL Editor. Safe to run again.
-- «تنظيف البشرة» (skincare) becomes its own department in bookings, separate from laser (user's choice 2026-10-29).
-- Doctors and offers may be put under it too.

-- The old department checks (whatever Postgres named them) are dropped…
do $$
declare r record;
begin
  for r in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('public.bookings'::regclass, 'public.doctors'::regclass, 'public.offers'::regclass)
      and pg_get_constraintdef(oid) like '%service%'
      and pg_get_constraintdef(oid) like '%dentistry%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

-- …and added back with skincare.
alter table public.bookings add constraint bookings_service_check
  check (service in ('dentistry', 'derma', 'laser', 'skincare', 'gynecology', 'pediatrics', 'general'));
alter table public.doctors add constraint doctors_service_check
  check (service in ('dentistry', 'derma', 'laser', 'skincare', 'gynecology', 'pediatrics', 'general'));
alter table public.offers add constraint offers_service_check
  check (service in ('dentistry', 'derma', 'laser', 'skincare', 'gynecology', 'pediatrics', 'general'));
