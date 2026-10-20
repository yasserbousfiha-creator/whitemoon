-- Run once in Supabase SQL Editor (after 016). Safe to run again.
-- Anonymous site statistics for /admin → "الإحصائيات": visits, branch pages opened, booking-button and WhatsApp
-- clicks. No personal data: `visitor` is a random id the browser keeps, so one person is counted once.

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('visit', 'branch', 'book_click', 'whatsapp')),
  branch text check (branch in ('khamseen', 'shahar', 'wisam')),
  visitor text not null check (char_length(visitor) between 8 and 64),
  created_at timestamptz not null default now()
);
create index if not exists site_events_created_at on public.site_events (created_at);

-- Written and read with the server key only (POST /api/track, and the stats function below).
alter table public.site_events enable row level security;
revoke all on public.site_events from anon, authenticated;
grant select, insert on public.site_events to service_role;

-- Everything the stats tab shows since a moment: visitors and visits, then per event type and branch the number of
-- clicks/opens and of different people, and the bookings actually sent.
create or replace function public.site_stats(since timestamptz)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'visitors', (select count(distinct visitor) from site_events where type = 'visit' and created_at >= since),
    'visits', (select count(*) from site_events where type = 'visit' and created_at >= since),
    'events', (
      select coalesce(json_agg(r), '[]'::json) from (
        select type, branch, count(*) as total, count(distinct visitor) as people
        from site_events where type <> 'visit' and created_at >= since group by type, branch
      ) r
    ),
    'bookings', (
      select coalesce(json_agg(r), '[]'::json) from (
        select branch, count(*) as total from bookings where created_at >= since group by branch
      ) r
    )
  );
$$;
revoke all on function public.site_stats(timestamptz) from public, anon, authenticated;
grant execute on function public.site_stats(timestamptz) to service_role;
