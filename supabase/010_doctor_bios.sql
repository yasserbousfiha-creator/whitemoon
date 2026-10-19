-- Run once in Supabase SQL Editor (after 009_doctors.sql). Safe to run again.
-- A short bio per doctor (paragraphs on separate lines), shown in the app's doctor profile and edited from /admin.
alter table public.doctors add column if not exists bio_ar text not null default '' check (char_length(bio_ar) <= 1500);
alter table public.doctors add column if not exists bio_en text not null default '' check (char_length(bio_en) <= 1500);

-- The bios the app shipped with (only where none has been written yet).
update public.doctors set bio_ar = 'استشاري جراحة وزراعة الأسنان، يقدّم زراعة الأسنان وجراحات الفم بخطط علاجية واضحة ومدروسة.', bio_en = 'Consultant in oral surgery and dental implants, offering implants and oral surgery with clear, well-planned treatment.' where id = 'ahmed-sobhi' and bio_ar = '';
update public.doctors set bio_ar = 'طبيب أسنان عام، يقدّم الفحص والحشوات وعلاج العصب والتنظيف والعناية الشاملة بصحة الفم والأسنان.', bio_en = 'General dentist offering check-ups, fillings, root canal treatment, cleaning and complete oral care.' where id = 'ali-alkhalili' and bio_ar = '';
update public.doctors set bio_ar = 'أخصائية تركيبات وتجميل الأسنان، تهتم بالتيجان والجسور والفينير لابتسامة طبيعية ومتناسقة.', bio_en = 'Prosthodontics and cosmetic dentistry specialist: crowns, bridges and veneers for a natural, balanced smile.' where id = 'souad' and bio_ar = '';
update public.doctors set bio_ar = 'طبيب أسنان عام، يقدّم الفحص والتنظيف والحشوات والعناية الدورية بصحة الفم والأسنان.', bio_en = 'General dentist offering check-ups, cleaning, fillings and routine oral care.' where id = 'abdullah-alotaibi' and bio_ar = '';
update public.doctors set bio_ar = 'أخصائية تقويم الأسنان، تعالج تقدّم الأسنان والفراغات وسوء الإطباق بخطط تقويم مدروسة لابتسامة متناسقة وإطباق سليم.', bio_en = 'Orthodontist treating protruding teeth, gaps and bite problems with carefully planned treatment for a balanced smile and a healthy bite.' where id = 'yasmine' and bio_ar = '';
update public.doctors set bio_ar = 'طبيبة في قسم الجلدية والتجميل، تهتم بإجراءات النضارة وتجديد البشرة والعناية بالشعر.
تتعامل مع كل مراجع بأسلوب هادئ يمنحه الثقة والراحة من أول زيارة.', bio_en = 'A doctor in our dermatology and aesthetics department, focused on skin rejuvenation, radiance treatments and hair care.
Her calm approach puts patients at ease from the very first visit.' where id = 'fatima-alzahraa' and bio_ar = '';
update public.doctors set bio_ar = 'أخصائية جلدية وتجميل، تهتم بعلاج مشكلات البشرة وإجراءات التجميل والنضارة بخطط تناسب كل بشرة.', bio_en = 'Dermatology and aesthetics specialist treating skin concerns and offering cosmetic and radiance treatments tailored to each skin.' where id = 'ola-atef' and bio_ar = '';
update public.doctors set bio_ar = 'استشاري في قسم الجلدية والتجميل، يقدّم الاستشارات والإجراءات التجميلية غير الجراحية. متواجد يومي الأحد والأربعاء مساءً.
يحرص على شرح الخيارات العلاجية بوضوح ليختار المراجع ما يناسبه.', bio_en = 'A consultant in our dermatology and aesthetics department, offering consultations and non-surgical aesthetic procedures. Available Sunday and Wednesday evenings.
He explains every treatment option clearly so patients can choose what suits them.' where id = 'ahmed-althubaiti' and bio_ar = '';
