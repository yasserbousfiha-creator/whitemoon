-- Run once in Supabase SQL Editor (after 008_more_services.sql). Safe to run again: the seed skips doctors already there.
-- Doctors move from the code (src/lib/doctors.ts, content.ts) into this table, edited from /admin → "الأطباء".

create table if not exists public.doctors (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar text not null check (char_length(name_ar) between 2 and 100),
  name_en text not null check (char_length(name_en) between 2 and 100),
  role_ar text not null default '' check (char_length(role_ar) <= 150),
  role_en text not null default '' check (char_length(role_en) <= 150),
  -- Other display names older app versions may send with a booking.
  aliases text[] not null default '{}',
  branch text not null check (branch in ('khamseen', 'shahar', 'wisam')),
  service text not null check (service in ('dentistry', 'derma', 'laser', 'gynecology', 'pediatrics', 'general')),
  -- Shifts per weekday (0 = Sunday … 6 = Saturday), e.g. {"0": [["13:00", "21:00"]], "6": [["09:30", "12:30"], ["16:30", "21:30"]]}.
  hours jsonb not null default '{}',
  photo text,
  portrait text,
  cases text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);

-- The public site reads visible doctors with the publishable key; /admin writes with the server key.
alter table public.doctors enable row level security;
drop policy if exists "anyone reads visible doctors" on public.doctors;
create policy "anyone reads visible doctors" on public.doctors for select to anon, authenticated using (active);
revoke all on public.doctors from anon, authenticated;
grant select on public.doctors to anon, authenticated;
grant select, insert, update, delete on public.doctors to service_role;

-- Photos uploaded from /admin (public bucket; uploads go through the server key only).
insert into storage.buckets (id, name, public) values ('doctors', 'doctors', true) on conflict (id) do nothing;

insert into public.doctors (id, name_ar, name_en, role_ar, role_en, aliases, branch, service, hours, photo, portrait, sort_order) values
  ('ahmed-sobhi', 'د. أحمد صبحي', 'Dr. Ahmed Sobhi', 'استشاري جراحة وزراعة الأسنان', 'Consultant, Oral Surgery & Implants', '{}', 'khamseen', 'dentistry', '{"0":[["13:00","21:00"]],"1":[["13:00","21:00"]],"2":[["13:00","21:00"]],"3":[["13:00","21:00"]],"4":[["13:00","21:00"]],"5":[["13:00","21:00"]],"6":[["13:00","21:00"]]}', '/images/team/ahmed-sobhi.jpg', '/images/team/ahmed-sobhi-portrait.jpg', 10),
  ('ali-alkhalili', 'د. علي الخليلي', 'Dr. Ali Al-Khalili', 'طبيب أسنان عام', 'General Dentist', '{}', 'khamseen', 'dentistry', '{"0":[["13:00","21:00"]],"1":[["13:00","21:00"]],"2":[["13:00","21:00"]],"3":[["12:00","20:00"]],"4":[["12:00","20:00"]],"6":[["12:00","20:00"]]}', '/images/team/ali-alkhalili.jpg', '/images/team/ali-alkhalili-portrait.jpg', 20),
  ('souad', 'د. سعاد', 'Dr. Souad', 'أخصائية تركيبات وتجميل الأسنان', 'Prosthodontics & Cosmetic Dentistry', '{}', 'khamseen', 'dentistry', '{"0":[["09:30","12:30"],["16:30","21:30"]],"1":[["09:30","12:30"],["16:30","21:30"]],"2":[["09:30","12:30"],["16:30","21:30"]],"3":[["09:30","12:30"],["16:30","21:30"]],"4":[["09:30","12:30"],["16:30","21:30"]],"5":[["09:30","12:30"],["16:30","21:30"]],"6":[["09:30","12:30"],["16:30","21:30"]]}', '/images/team/souad.jpg', '/images/team/souad-portrait.jpg', 30),
  ('abdullah-alotaibi', 'د. عبدالله العتيبي', 'Dr. Abdullah Al-Otaibi', 'طبيب أسنان عام', 'General Dentist', '{}', 'khamseen', 'dentistry', '{"0":[["17:00","21:00"]],"1":[["17:00","21:00"]],"2":[["17:00","21:00"]],"3":[["17:00","21:00"]],"4":[["17:00","21:00"]],"5":[["17:00","21:00"]],"6":[["17:00","21:00"]]}', '/images/team/abdullah-alotaibi.jpg', '/images/team/abdullah-alotaibi-portrait.jpg', 40),
  ('yasmine', 'د. ياسمين', 'Dr. Yasmine', 'أخصائية تقويم الأسنان', 'Orthodontist', '{}', 'khamseen', 'dentistry', '{"0":[["09:30","12:30"],["16:30","21:30"]],"1":[["09:30","12:30"],["16:30","21:30"]],"2":[["09:30","12:30"],["16:30","21:30"]],"3":[["09:30","12:30"],["16:30","21:30"]],"4":[["09:30","12:30"],["16:30","21:30"]],"5":[["09:30","12:30"],["16:30","21:30"]],"6":[["09:30","12:30"],["16:30","21:30"]]}', '/images/team/yasmine.jpg', '/images/team/yasmine-portrait.jpg', 50),
  ('mohammed-althaqafi', 'د. محمد الثقفي', 'Dr. Mohammed Al-Thaqafi', 'طبيب أسنان عام', 'General Dentist', '{}', 'khamseen', 'dentistry', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"5":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/mohammed-althaqafi.jpg', '/images/team/mohammed-althaqafi-portrait.jpg', 60),
  ('saif-alotaibi', 'د. سيف العتيبي', 'Dr. Saif Al-Otaibi', 'طبيب أسنان', 'Dentist', '{}', 'shahar', 'dentistry', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/saif-alotaibi.jpg', '/images/team/saif-alotaibi-portrait.jpg', 70),
  ('ahmed-yahya', 'د. أحمد يحيى', 'Dr. Ahmed Yahya', 'استشاري تقويم الأسنان والفكين', 'Consultant, Orthodontics & Jaw Orthopedics', '{}', 'shahar', 'dentistry', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/ahmed-yahya.jpg', '/images/team/ahmed-yahya-portrait.jpg', 80),
  ('asmaa-abubakr', 'د. أسماء أبو بكر', 'Dr. Asmaa Abu Bakr', 'استشارية تركيبات الأسنان', 'Consultant, Prosthodontics', '{}', 'shahar', 'dentistry', '{"0":[["15:00","21:00"]],"1":[["15:00","21:00"]],"2":[["15:00","21:00"]],"3":[["15:00","21:00"]],"6":[["15:00","21:00"]]}', '/images/team/asmaa-abubakr.jpg', '/images/team/asmaa-abubakr-portrait.jpg', 90),
  ('methaq-ahmed', 'د. ميثاق أحمد', 'Dr. Methaq Ahmed', 'أخصائي زراعة وجراحة الأسنان', 'Implant & Oral Surgery Specialist', '{}', 'shahar', 'dentistry', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/methaq-ahmed.jpg', '/images/team/methaq-ahmed-portrait.jpg', 100),
  ('enam-ali', 'د. إنعام علي', 'Dr. Enam Ali', 'أخصائية أسنان الأطفال', 'Pediatric Dentist', '{}', 'shahar', 'dentistry', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/enam-ali.jpg', '/images/team/enam-ali-portrait.jpg', 110),
  ('osama-alshehri', 'د. أسامة الشهري', 'Dr. Osama Al-Shehri', 'طبيب أسنان عام', 'General Dentist', '{}', 'shahar', 'dentistry', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/osama-alshehri.jpg', '/images/team/osama-alshehri-portrait.jpg', 120),
  ('fatima-alzahraa', 'د. فاطمة الزهراء', 'Dr. Fatima Al-Zahraa', 'الجلدية والتجميل', 'Dermatology & Aesthetics', '{}', 'khamseen', 'derma', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"5":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/fatima-alzahraa.jpg', '/images/team/fatima-alzahraa-portrait.jpg', 130),
  ('ola-atef', 'د. علا عاطف', 'Dr. Ola Atef', 'أخصائية جلدية وتجميل', 'Dermatology & Aesthetics Specialist', '{}', 'khamseen', 'derma', '{"0":[["09:00","22:00"]],"1":[["09:00","22:00"]],"2":[["09:00","22:00"]],"3":[["09:00","22:00"]],"4":[["09:00","22:00"]],"5":[["09:00","22:00"]],"6":[["09:00","22:00"]]}', '/images/team/ola-atef.jpg', '/images/team/ola-atef-portrait.jpg', 140),
  ('ahmed-althubaiti', 'أحمد الثبيتي', 'Ahmed Al-Thubaiti', 'استشاري', 'Consultant', array['د. أحمد الثبيتي', 'Dr. Ahmed Al-Thubaiti'], 'khamseen', 'derma', '{"0":[["17:00","21:00"]],"3":[["17:00","21:00"]]}', '/images/team/ahmed-althubaiti.jpg', null, 150),
  ('eman-ismail', 'د. إيمان إسماعيل', 'Dr. Eman Ismail', 'أخصائية جلدية وليزر', 'Dermatology & Laser Specialist', '{}', 'shahar', 'derma', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/eman-ismail.jpg', '/images/team/eman-ismail-portrait.jpg', 160),
  ('rania-mostafa', 'د. رانيا مصطفى', 'Dr. Rania Mostafa', 'أخصائية نساء وولادة', 'Obstetrics & Gynecology Specialist', '{}', 'shahar', 'gynecology', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/rania-mostafa.jpg', '/images/team/rania-mostafa-portrait.jpg', 170),
  ('khaled-omar', 'د. خالد عمر', 'Dr. Khaled Omar', 'أخصائي أطفال وحديثي الولادة', 'Pediatrics & Neonatology Specialist', '{}', 'shahar', 'pediatrics', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/khaled-omar.jpg', '/images/team/khaled-omar-portrait.jpg', 180),
  ('dina-tawfik', 'د. دينا توفيق', 'Dr. Dina Tawfik', 'طبيبة عامة', 'General Practitioner', '{}', 'shahar', 'general', '{"0":[["13:30","21:30"]],"1":[["13:30","21:30"]],"2":[["13:30","21:30"]],"3":[["13:30","21:30"]],"4":[["13:30","21:30"]],"6":[["13:30","21:30"]]}', '/images/team/dina-tawfik.jpg', '/images/team/dina-tawfik-portrait.jpg', 190)

on conflict (id) do nothing;
