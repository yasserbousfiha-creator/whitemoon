-- Run once in Supabase SQL Editor. Safe to run again.
-- Full Arabic names for three doctors; the old names stay as aliases so bookings sent with them still match.

update public.doctors
set name_ar = 'د. ياسمين محمد',
    aliases = array(select distinct unnest(aliases || array['د. ياسمين'])),
    updated_at = now()
where id = 'yasmine';

update public.doctors
set name_ar = 'د. سعاد شيخو',
    aliases = array(select distinct unnest(aliases || array['د. سعاد'])),
    updated_at = now()
where id = 'souad';

update public.doctors
set name_ar = 'د. أحمد الثبيتي',
    aliases = array(select distinct unnest(aliases || array['أحمد الثبيتي'])),
    updated_at = now()
where id = 'ahmed-althubaiti';
