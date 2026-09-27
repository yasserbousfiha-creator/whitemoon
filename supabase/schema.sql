-- White Moon bookings. Run once in Supabase: SQL Editor → New query → paste → Run. Then run 002_appointment_time.sql.
--
-- Bookings are inserted only by the website's booking API with the secret key (which bypasses row level security).
-- Reception staff sign in to /admin; the policies below let each staff member see and update only their branch
-- (or every branch when their staff.branch is null).

create type public.booking_status as enum ('new', 'contacted', 'confirmed', 'cancelled');

create table public.bookings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null,
  email text not null,
  service text not null check (service in ('dentistry', 'derma', 'laser')),
  branch text not null check (branch in ('khamseen', 'shahar', 'wisam')),
  source text not null default 'web' check (source in ('web', 'app')),
  status public.booking_status not null default 'new',
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

create index bookings_branch_created_idx on public.bookings (branch, created_at desc);
create index bookings_status_idx on public.bookings (status);

-- One row per reception account. branch = null means the account sees all branches (management).
create table public.staff (
  user_id uuid primary key references auth.users on delete cascade,
  name text not null,
  branch text check (branch in ('khamseen', 'shahar', 'wisam'))
);

alter table public.bookings enable row level security;
alter table public.staff enable row level security;

create policy "staff read own row" on public.staff
  for select to authenticated
  using (user_id = (select auth.uid()));

-- True when the signed-in user is staff for this branch (or for all branches).
create function public.is_staff_for(b text) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and (s.branch is null or s.branch = b)
  );
$$;

create policy "staff read branch bookings" on public.bookings
  for select to authenticated
  using (public.is_staff_for(branch));

create policy "staff update branch bookings" on public.bookings
  for update to authenticated
  using (public.is_staff_for(branch))
  with check (public.is_staff_for(branch));

-- Newer projects don't grant table access to API roles by default, so grant it explicitly.
grant select on public.staff to authenticated;
grant select on public.bookings to authenticated;
grant select, insert on public.bookings to service_role;

-- Staff may only change the workflow columns, never the patient's details.
revoke update on public.bookings from authenticated;
grant update (status, notes, updated_at, updated_by) on public.bookings to authenticated;
revoke all on public.bookings from anon;
revoke all on public.staff from anon;
