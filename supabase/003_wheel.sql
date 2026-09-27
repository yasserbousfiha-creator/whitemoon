-- Run once in Supabase SQL Editor after 002_appointment_time.sql.
-- Lucky wheel: one spin per phone number per calendar month (Riyadh time). The prize is drawn on the server,
-- and reception checks the code in /admin and marks it used.

create table public.wheel_spins (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null, -- normalized international digits, e.g. 9665XXXXXXXX
  prize text not null check (prize in ('prosthetics15', 'free_consult', 'ortho10')),
  code text not null unique,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users on delete set null,
  unique (phone, month)
);

alter table public.wheel_spins enable row level security;

-- Any staff account may look up a code; writes go through the server's secret key after a staff check.
create policy "staff read spins" on public.wheel_spins
  for select to authenticated
  using (exists (select 1 from public.staff s where s.user_id = (select auth.uid())));

grant select on public.wheel_spins to authenticated;
grant select, insert, update on public.wheel_spins to service_role;
revoke all on public.wheel_spins from anon;
