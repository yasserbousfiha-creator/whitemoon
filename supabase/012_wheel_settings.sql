-- Run once in Supabase SQL Editor (after 011_offers.sql). Safe to run again.
-- Lucky wheel settings, edited from /admin → "جوائز العجلة": whether the wheel shows on the site, and its prizes.

create table if not exists public.wheel_settings (
  id smallint primary key default 1 check (id = 1), -- a single row
  enabled boolean not null default true,
  -- [{ "id": "free_consult", "ar": "كشف مجاني", "en": "Free consultation", "shortAr": ["كشف", "مجاني"],
  --    "shortEn": ["FREE", "Consult"], "weight": 1 }, …]; weight = relative odds.
  prizes jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

-- The public site reads the settings with the publishable key; /admin writes with the server key.
alter table public.wheel_settings enable row level security;
drop policy if exists "anyone reads wheel settings" on public.wheel_settings;
create policy "anyone reads wheel settings" on public.wheel_settings for select to anon, authenticated using (true);
revoke all on public.wheel_settings from anon, authenticated;
grant select on public.wheel_settings to anon, authenticated;
grant select, insert, update on public.wheel_settings to service_role;

-- The prizes the wheel had until now.
insert into public.wheel_settings (id, prizes) values (1, '[
  {"id": "prosthetics15", "ar": "خصم 15% على التركيبات", "en": "15% off crowns & bridges", "shortAr": ["خصم 15%", "التركيبات"], "shortEn": ["15% OFF", "Crowns"], "weight": 1},
  {"id": "free_consult", "ar": "كشف مجاني", "en": "Free consultation", "shortAr": ["كشف", "مجاني"], "shortEn": ["FREE", "Consult"], "weight": 1},
  {"id": "ortho10", "ar": "خصم 10% على تقويم الأسنان", "en": "10% off orthodontics", "shortAr": ["خصم 10%", "التقويم"], "shortEn": ["10% OFF", "Ortho"], "weight": 1}
]') on conflict (id) do nothing;

-- Prizes can now be added from /admin, so a spin keeps the prize's name as it was when won.
alter table public.wheel_spins drop constraint if exists wheel_spins_prize_check;
alter table public.wheel_spins add constraint wheel_spins_prize_check check (prize ~ '^[a-z0-9_-]{1,40}$');
alter table public.wheel_spins add column if not exists prize_ar text check (char_length(prize_ar) <= 80);
alter table public.wheel_spins add column if not exists prize_en text check (char_length(prize_en) <= 80);
update public.wheel_spins set
  prize_ar = case prize when 'prosthetics15' then 'خصم 15% على التركيبات' when 'free_consult' then 'كشف مجاني' when 'ortho10' then 'خصم 10% على تقويم الأسنان' end,
  prize_en = case prize when 'prosthetics15' then '15% off crowns & bridges' when 'free_consult' then 'Free consultation' when 'ortho10' then '10% off orthodontics' end
where prize_ar is null;
