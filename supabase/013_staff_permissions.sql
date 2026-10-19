-- Run once in Supabase SQL Editor (after 012_wheel_settings.sql). Safe to run again.
-- /admin accounts and their permissions, managed from /admin → "المستخدمون" by the site admin:
--   is_admin — manages the accounts (adds them, sets what each one sees, resets passwords);
--   tabs     — the /admin sections this account may open (null = the defaults: every section for a
--              management account (branch null), bookings / prizes / schedule for a branch's reception).
-- The current management accounts (branch null) become site admins.

alter table public.staff add column if not exists is_admin boolean not null default false;
alter table public.staff add column if not exists tabs text[];
alter table public.staff add column if not exists created_at timestamptz not null default now();

update public.staff set is_admin = true where branch is null and not is_admin
  and not exists (select 1 from public.staff where is_admin);

-- The /admin actions read and write accounts with the server key.
grant select, insert, update, delete on public.staff to service_role;
