-- Run once in Supabase SQL Editor (after 016_shahar_october_offers.sql). Safe to run again.
-- Security review (2026-10-22):
--   1. A staff account reads bookings directly only with the bookings or schedule section (as /admin shows them), and
--      never changes them directly: every change goes through the server's checks and secret key.
--   2. Prize codes are read only through the server (after the prizes-section check), never directly.
--   3. Request limits for the public forms and the staff sign-in (lib/rate-limit.ts). Until this file is run, the
--      site simply works without them.
-- Also, in Supabase → Authentication → Sign In / Providers: turn off "Allow new users to sign up" (staff accounts are
-- created from /admin), and turn on leaked password protection if the plan offers it.

-- 1. Bookings
create or replace function public.staff_reads_bookings(b text) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid())
      and (s.branch is null or s.branch = b)
      -- tabs null = the defaults, which include the bookings for every account.
      and (s.is_admin or s.tabs is null or s.tabs && array['bookings', 'bookings:view', 'schedule', 'schedule:view'])
  );
$$;
revoke execute on function public.staff_reads_bookings(text) from public, anon;
grant execute on function public.staff_reads_bookings(text) to authenticated;

drop policy if exists "staff read branch bookings" on public.bookings;
create policy "staff read branch bookings" on public.bookings
  for select to authenticated
  using (public.staff_reads_bookings(branch));

drop policy if exists "staff update branch bookings" on public.bookings;
revoke update on public.bookings from authenticated;
grant select, insert, update, delete on public.bookings to service_role;

-- No longer used by any policy; kept for older setups, but not callable by visitors.
revoke execute on function public.is_staff_for(text) from public, anon;

-- 2. Prize codes
drop policy if exists "staff read spins" on public.wheel_spins;
revoke all on public.wheel_spins from anon, authenticated;

-- 3. Request limits: one row per key (e.g. "booking:ip:1.2.3.4"), counting hits in the current window.
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant select, insert, update, delete on public.rate_limits to service_role;

-- Counts one hit for the key; true while it stays within p_max hits per p_window_seconds.
create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer) returns boolean
  language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end,
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end
  returning hits into n;
  -- Now and then, forget keys that have been quiet for a day.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return n <= p_max;
end;
$$;
revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
