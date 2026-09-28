export type Locale = "ar" | "en";

export type ServiceExtraType = "shadeGuide" | "radianceBar" | "waveTags";
export type JourneyIcon = "reachOut" | "book" | "diagnose" | "result";

export interface QualityBadge {
  icon: "award" | "sparkle" | "smile" | "spa";
  title: string;
  subtitle: string;
}

import type { DoctorId } from "./doctors";

export interface TeamMember {
  role: string;
  name?: string;
  // Leave undefined to show a placeholder avatar.
  photo?: string;
  // Where this doctor sees patients; pre-selected when booking with them.
  branch?: Branch["id"];
  // Links to their working hours in lib/doctors.ts.
  id?: DoctorId;
}

export interface ServiceContent {
  icon: "dentistry" | "derma" | "laser";
  title: string;
  items: string[];
  extraLabel: string;
  extraType: ServiceExtraType;
  waveTags?: string[];
  note: string;
  team: TeamMember[];
}

export interface JourneyPhase {
  step: string;
  icon: JourneyIcon;
  name: string;
  desc: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export interface BookingStrings {
  eyebrow: string;
  heading: string;
  intro: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  branch: string;
  date: string;
  time: string;
  pickDateFirst: string;
  doctor: string;
  bookWith: string;
  removeDoctor: string;
  unavailable: string;
  closedHint: string;
  morning: string;
  evening: string;
  select: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  invalid: string;
}

export interface WheelStrings {
  eyebrow: string;
  heading: string;
  intro: string;
  name: string;
  phone: string;
  spin: string;
  spinning: string;
  won: string;
  already: string;
  code: string;
  validUntil: string;
  showCode: string;
  book: string;
  invalid: string;
  error: string;
  terms: string;
}

export interface AccountStrings {
  title: string;
  guestTitle: string;
  guestBody: string;
  name: string;
  phone: string;
  email: string;
  upcoming: string;
  past: string;
  noUpcoming: string;
  clinicNote: string;
  statuses: Record<"new" | "contacted" | "confirmed" | "cancelled", string>;
  signOut: string;
  close: string;
}

export interface Branch {
  id: "khamseen" | "shahar" | "wisam";
  name: string;
  address: string;
  mapUrl: string;
}

export interface NavItem {
  label: string;
  sectionId: string;
}

export interface Content {
  phone: string;
  phoneDisplay: string;
  whatsappUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  snapchatUrl: string;

  navHome: string;
  navServices: string;
  navAbout: string;
  navContact: string;
  ctaCall: string;
  ctaBookNow: string;
  ctaBookWhatsApp: string;
  ctaExploreServices: string;
  ctaMessageWhatsApp: string;
  ctaCallNow: string;

  heroEyebrow: string;
  heroHeadline: string;
  heroLede: string;

  introEyebrow: string;
  introHeading: string;
  introBody: string;
  badges: QualityBadge[];

  servicesEyebrow: string;
  servicesHeading: string;
  servicesIntro: string;
  services: ServiceContent[];
  teamLabel: string;
  doctorsEyebrow: string;
  account: AccountStrings;
  doctorsHeading: string;
  doctorsIntro: string;
  teamPhotoNote: string;

  journeyEyebrow: string;
  journeyHeading: string;
  journeyPhases: JourneyPhase[];

  booking: BookingStrings;
  wheel: WheelStrings;

  testimonialsEyebrow: string;
  testimonialsHeading: string;
  testimonials: Testimonial[];

  contactEyebrow: string;
  contactHeading: string;
  branchesLabel: string;
  branches: Branch[];
  workingHoursValue: string;
  phoneLabel: string;
  followLabel: string;
  followValue: string;
  mapPinTitle: string;
  mapPinNote: string;

  aboutEyebrow: string;
  aboutHeading: string;
  aboutBody1: string;
  aboutBody2: string;

  footerDesc: string;
  footerSite: string;
  footerSpecialties: string;
  footerContact: string;
  footerCopyright: string;
  footerPreview: string;
  brandName: string;
  brandTagline: string;

  navItems: NavItem[];
}

const phone = "+966551300836";
const phoneDisplay = "+966 55 130 0836";
const whatsappUrl = "https://wa.link/wn6jdc";
const instagramUrl = "https://www.instagram.com/whitemoonclinic";
const tiktokUrl = "https://vt.tiktok.com/ZSdGb4HMJ/";
const snapchatUrl = "https://www.snapchat.com/add/whitemoonclinic";

// Khamseen is the pin from whitemoonclinics.com; Wisam is its Google Maps place. Shahar has no published pin yet,
// so it opens a Google Maps search for the clinic in that district.
const mapSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const mapUrls = {
  khamseen: "https://maps.app.goo.gl/EbqYmfLYz6tniTkw7",
  shahar: mapSearch("مجمع وايت مون الطبي شهار الطائف"),
  wisam: "https://maps.google.com/?cid=13044452598520757617",
};

export const arContent: Content = {
  phone,
  phoneDisplay,
  whatsappUrl,
  instagramUrl,
  tiktokUrl,
  snapchatUrl,
  navHome: "الرئيسية",
  navServices: "الخدمات",
  navAbout: "من نحن",
  navContact: "تواصل معنا",
  ctaCall: "اتصل بنا",
  ctaBookNow: "احجز موعدك",
  ctaBookWhatsApp: "احجز عبر واتساب",
  ctaExploreServices: "استكشف الخدمات",
  ctaMessageWhatsApp: "راسلنا على واتساب",
  ctaCallNow: "اتصل الآن",
  heroEyebrow: "عيادة أسنان · جلدية · ليزر — الطائف",
  heroHeadline: "ابتسامتك وبشرتك تستحقان عناية تليق بك",
  heroLede:
    "مجمع وايت مون الطبي، حيث تلتقي الخبرة الطبية بأحدث تقنيات طب الأسنان والجلدية والليزر، لنتائج طبيعية تراعي تفاصيلك في أجواء هادئة وخاصة.",
  introEyebrow: "من نحن",
  introHeading: "مجمع طبي متكامل يجمع ثلاث ركائز تحت سقف واحد",
  introBody:
    "يضم وايت مون نخبة من الأطباء المتخصصين في طب الأسنان والجلدية والليزر، ويعتمد على أحدث الأجهزة والتقنيات الطبية لتقديم رعاية دقيقة تحافظ على ملامحك الطبيعية، ضمن معايير جودة واحترافية عالية.",
  badges: [
    { icon: "award", title: "نخبة من الأطباء", subtitle: "فريق طبي متخصص في كل مجال" },
    { icon: "smile", title: "نتائج طبيعية", subtitle: "علاج يحافظ على ملامحك" },
    { icon: "sparkle", title: "تقنيات حديثة", subtitle: "أجهزة معتمدة وحديثة" },
    { icon: "spa", title: "أجواء خاصة", subtitle: "راحة تامة من أول زيارة" },
  ],
  servicesEyebrow: "تخصصاتنا",
  servicesHeading: "ثلاث ركائز طبية، فريق واحد",
  servicesIntro: "كل تخصص لدينا يُدار بفريقه الخاص وأدواته الدقيقة، ضمن معايير واحدة من الجودة والاحترافية.",
  services: [
    {
      icon: "dentistry",
      title: "طب الأسنان",
      items: ["تنظيف وتبييض الأسنان", "تجميل الأسنان والفينير", "زراعة الأسنان", "تقويم الأسنان"],
      extraLabel: "دليل درجات البياض",
      extraType: "shadeGuide",
      note: "دقة تشبه الحِرفة، لابتسامة تبدو أنها لم تُعالَج قط.",
      team: [{ role: "استشاري طب أسنان" }, { role: "أخصائية تجميل أسنان" }, { role: "أخصائي تقويم" }],
    },
    {
      icon: "derma",
      title: "الجلدية والتجميل",
      items: ["الفيلر", "البوتوكس", "برامج العناية بالبشرة", "علاج التصبغات"],
      extraLabel: "خارطة إشراقة البشرة",
      extraType: "radianceBar",
      note: "إشراقة تُقرأ في الإضاءة الطبيعية، لا في المرآة فقط.",
      team: [
        { name: "د. ياسمين", role: "الجلدية والتجميل", photo: "/images/team/yasmine.jpg", branch: "khamseen", id: "yasmine" },
        { name: "د. سعاد", role: "الجلدية والتجميل", photo: "/images/team/souad.jpg", branch: "khamseen", id: "souad" },
        { name: "د. فاطمة الزهراء", role: "الجلدية والتجميل", photo: "/images/team/fatima-alzahraa.jpg", branch: "khamseen", id: "fatima-alzahraa" },
        { name: "أحمد الثبيتي", role: "استشاري", photo: "/images/team/ahmed-althubaiti.jpg", branch: "khamseen", id: "ahmed-althubaiti" },
      ],
    },
    {
      icon: "laser",
      title: "الليزر وتنظيف البشرة",
      items: ["إزالة الشعر بالليزر", "تجديد نضارة البشرة", "تفتيح الهالات الداكنة", "تنظيف البشرة العميق"],
      extraLabel: "أطوال موجية علاجية",
      extraType: "waveTags",
      waveTags: ["755nm", "810nm", "1064nm"],
      note: "أطوال موجية دقيقة، مُعايرة لكل نوع بشرة.",
      team: [{ role: "أخصائي ليزر" }, { role: "أخصائية عناية بالبشرة" }],
    },
  ],
  teamLabel: "الفريق الطبي",
  account: {
    title: "حسابي",
    guestTitle: "لم تسجّل بعد",
    guestBody: "احجز موعدك الأول وسنحفظ بياناتك على هذا الجهاز، فتظهر هنا مع مواعيدك وتُعبّأ تلقائياً في حجوزاتك القادمة.",
    name: "الاسم",
    phone: "الجوال",
    email: "البريد الإلكتروني",
    upcoming: "مواعيدي القادمة",
    past: "المواعيد السابقة",
    noUpcoming: "لا توجد مواعيد قادمة.",
    clinicNote: "ملاحظة العيادة",
    statuses: { new: "بانتظار التأكيد", contacted: "تم التواصل", confirmed: "مؤكد", cancelled: "ملغي" },
    signOut: "تسجيل الخروج",
    close: "إغلاق",
  },
  doctorsEyebrow: "الكادر الطبي",
  doctorsHeading: "أطباء تثق بهم",
  doctorsIntro: "نخبة من الأطباء المتخصصين، احجز موعدك مباشرة مع الطبيب الذي تفضّله.",
  teamPhotoNote: "الصور الفعلية للفريق ستُضاف قريبًا",
  journeyEyebrow: "من التواصل إلى الإشراقة",
  journeyHeading: "رحلتك معنا، خطوة بخطوة",
  journeyPhases: [
    { step: "01", icon: "reachOut", name: "التواصل", desc: "احجز موعدك الآن أو اتصل بنا" },
    { step: "02", icon: "book", name: "حجز الموعد", desc: "نحدد لك أنسب وقت للزيارة" },
    { step: "03", icon: "diagnose", name: "التشخيص", desc: "فحص دقيق وخطة علاج مخصصة" },
    { step: "04", icon: "result", name: "العلاج والنتيجة", desc: "عناية دقيقة ونتيجة مشرقة" },
  ],
  booking: {
    eyebrow: "احجز موعدك",
    heading: "احجز زيارتك في دقيقة",
    intro: "اختر التخصص والفرع واليوم والوقت المناسبين، وسيتواصل معك فريق الفرع لتأكيد الموعد.",
    name: "الاسم الكامل",
    phone: "رقم الجوال",
    email: "البريد الإلكتروني",
    service: "التخصص",
    branch: "الفرع",
    date: "اليوم المفضّل",
    time: "الوقت المفضّل",
    pickDateFirst: "اختر اليوم أولاً لعرض الأوقات المتاحة.",
    doctor: "الطبيب",
    bookWith: "احجز مع",
    removeDoctor: "إزالة الطبيب",
    unavailable: "هذا الموعد لم يعد متاحاً، اختر وقتاً آخر.",
    closedHint: "الأوقات باللون الأحمر غير متاحة.",
    morning: "الفترة الصباحية",
    evening: "الفترة المسائية",
    select: "اختر...",
    submit: "إرسال طلب الحجز",
    sending: "جارٍ الإرسال...",
    success: "تم استلام طلبك، سنتواصل معك قريبًا لتأكيد الموعد.",
    error: "تعذّر إرسال الطلب، حاول مرة أخرى أو تواصل معنا عبر واتساب.",
    invalid: "يرجى تعبئة جميع الحقول واختيار اليوم والوقت.",
  },
  wheel: {
    eyebrow: "عجلة الحظ",
    heading: "جرّب حظك واربح هدية",
    intro: "أدر العجلة مرة واحدة كل شهر واربح إحدى هدايانا: كشف مجاني، أو خصم على التركيبات أو تقويم الأسنان.",
    name: "الاسم",
    phone: "رقم الجوال",
    spin: "أدر العجلة",
    spinning: "العجلة تدور…",
    won: "مبروك! ربحت:",
    already: "عذراً، هذا الرقم استخدم محاولته لهذا الشهر. يمكنك المحاولة مجدداً في الشهر القادم. جائزتك الحالية:",
    code: "رمز الجائزة",
    validUntil: "صالحة حتى",
    showCode: "اعرض هذا الرمز على الاستقبال عند زيارتك.",
    book: "احجز موعدك الآن",
    invalid: "أدخل اسمك ورقم جوال صحيح.",
    error: "تعذّر تدوير العجلة، حاول مرة أخرى.",
    terms: "محاولة واحدة لكل رقم جوال في الشهر. الجائزة شخصية وغير قابلة للتحويل أو الاستبدال نقداً.",
  },
  testimonialsEyebrow: "آراء عملائنا",
  testimonialsHeading: "ثقة نراها في كل زيارة",
  // Placeholder reviews — replace with real patient testimonials before launch.
  testimonials: [
    { name: "ريم. أ", role: "تجميل الأسنان", quote: "تجربة مختلفة تمامًا، الفريق محترف والنتيجة فاقت توقعاتي." },
    { name: "سلطان. م", role: "الليزر وتنظيف البشرة", quote: "دقة عالية بالمواعيد واهتمام بالتفاصيل من أول زيارة." },
    { name: "نوف. س", role: "الجلدية والتجميل", quote: "بيئة هادئة ونتائج طبيعية بدون أي مبالغة." },
  ],
  contactEyebrow: "تواصل معنا",
  contactHeading: "زورونا في الطائف",
  branchesLabel: "فروعنا",
  // Branch addresses are placeholders beyond the original Khamseen St. address — replace with exact addresses.
  branches: [
    { id: "khamseen", name: "فرع الخمسين", address: "شارع الخمسين، الجال، الطائف", mapUrl: mapUrls.khamseen },
    { id: "shahar", name: "فرع شهار", address: "حي شهار، الطائف", mapUrl: mapUrls.shahar },
    { id: "wisam", name: "فرع الوسام", address: "حي الوسام، الطائف", mapUrl: mapUrls.wisam },
  ],
  workingHoursValue: "يوميًا من 9 صباحًا حتى 10 مساءً",
  phoneLabel: "الهاتف وواتساب",
  followLabel: "تابعونا",
  followValue: "Instagram · TikTok · Snapchat — @whitemoonclinic",
  mapPinTitle: "3 فروع في الطائف",
  mapPinNote: "مواقع تقريبية — سيتم ربطها بخريطة تفاعلية عند البناء النهائي",
  aboutEyebrow: "من نحن",
  aboutHeading: "قصة وايت مون",
  aboutBody1:
    "تأسس مجمع وايت مون ليكون وجهة طبية متكاملة في الطائف، تجمع بين طب الأسنان والجلدية والليزر تحت سقف واحد. نؤمن أن الرعاية الحقيقية تبدأ بالاستماع لاحتياجاتك، وتنتهي بنتائج طبيعية تدوم.",
  aboutBody2:
    "يعمل في المجمع نخبة من الأطباء المتخصصين، بأحدث الأجهزة والتقنيات المعتمدة، ضمن أجواء خاصة وهادئة صُممت لراحتك من أول زيارة وحتى النتيجة النهائية.",
  footerDesc: "مجمع طبي متخصص في طب الأسنان والجلدية والليزر بالطائف.",
  footerSite: "الموقع",
  footerSpecialties: "التخصصات",
  footerContact: "تواصل",
  footerCopyright: "© 2026 مجمع وايت مون الطبي. جميع الحقوق محفوظة.",
  footerPreview: "",
  brandName: "وايت مون",
  brandTagline: "مجمع طبي متخصص",
  navItems: [
    { label: "الرئيسية", sectionId: "home" },
    { label: "الخدمات", sectionId: "services" },
    { label: "الكادر الطبي", sectionId: "doctors" },
    { label: "من نحن", sectionId: "about" },
    { label: "تواصل معنا", sectionId: "contact" },
  ],
};

export const enContent: Content = {
  phone,
  phoneDisplay,
  whatsappUrl,
  instagramUrl,
  tiktokUrl,
  snapchatUrl,
  navHome: "Home",
  navServices: "Services",
  navAbout: "About",
  navContact: "Contact",
  ctaCall: "Call Us",
  ctaBookNow: "Book Now",
  ctaBookWhatsApp: "Book via WhatsApp",
  ctaExploreServices: "Explore Services",
  ctaMessageWhatsApp: "Message on WhatsApp",
  ctaCallNow: "Call Now",
  heroEyebrow: "Dentistry · Dermatology · Laser — Taif",
  heroHeadline: "Your Smile and Skin Deserve Care Worthy of You",
  heroLede:
    "White Moon Medical Complex, where medical expertise meets the latest in dentistry, dermatology and laser technology — natural results, attentive care, a calm and private setting.",
  introEyebrow: "About the Complex",
  introHeading: "One complex, three specialties, a single standard of care",
  introBody:
    "White Moon brings together specialist physicians in dentistry, dermatology and laser medicine, working with modern equipment and techniques to deliver precise care that respects your natural features — held to a high standard of quality and professionalism.",
  badges: [
    { icon: "award", title: "Specialist Physicians", subtitle: "Experts dedicated to each specialty" },
    { icon: "smile", title: "Natural Results", subtitle: "Treatment that honors your features" },
    { icon: "sparkle", title: "Modern Technology", subtitle: "Certified, up-to-date equipment" },
    { icon: "spa", title: "Private Setting", subtitle: "Comfort from your first visit" },
  ],
  servicesEyebrow: "Our Specialties",
  servicesHeading: "Three medical pillars, one team",
  servicesIntro: "Each specialty runs with its own team and precise tools, held to one shared standard of quality and professionalism.",
  services: [
    {
      icon: "dentistry",
      title: "Dentistry",
      items: ["Cleaning & whitening", "Cosmetic veneers", "Dental implants", "Orthodontics"],
      extraLabel: "Shade Guide Reference",
      extraType: "shadeGuide",
      note: "Craftsman precision, for a smile that never looks treated.",
      team: [{ role: "Dental Consultant" }, { role: "Cosmetic Dentistry Specialist" }, { role: "Orthodontics Specialist" }],
    },
    {
      icon: "derma",
      title: "Dermatology & Aesthetics",
      items: ["Dermal fillers", "Botox", "Skincare programs", "Pigmentation treatment"],
      extraLabel: "Skin Radiance Map",
      extraType: "radianceBar",
      note: "A glow that reads in daylight, not only in the mirror.",
      team: [
        { name: "Dr. Yasmine", role: "Dermatology & Aesthetics", photo: "/images/team/yasmine.jpg", branch: "khamseen", id: "yasmine" },
        { name: "Dr. Souad", role: "Dermatology & Aesthetics", photo: "/images/team/souad.jpg", branch: "khamseen", id: "souad" },
        { name: "Dr. Fatima Al-Zahraa", role: "Dermatology & Aesthetics", photo: "/images/team/fatima-alzahraa.jpg", branch: "khamseen", id: "fatima-alzahraa" },
        { name: "Ahmed Al-Thubaiti", role: "Consultant", photo: "/images/team/ahmed-althubaiti.jpg", branch: "khamseen", id: "ahmed-althubaiti" },
      ],
    },
    {
      icon: "laser",
      title: "Laser & Skin Cleansing",
      items: ["Laser hair removal", "Skin resurfacing", "Under-eye brightening", "Deep skin cleansing"],
      extraLabel: "Therapeutic Wavelengths",
      extraType: "waveTags",
      waveTags: ["755nm", "810nm", "1064nm"],
      note: "Precise wavelengths, calibrated to every skin type.",
      team: [{ role: "Laser Specialist" }, { role: "Skincare Specialist" }],
    },
  ],
  teamLabel: "Medical Team",
  account: {
    title: "My Account",
    guestTitle: "Not signed in yet",
    guestBody: "Book your first appointment and we'll save your details on this device, so they show here with your appointments and fill in your next bookings.",
    name: "Name",
    phone: "Mobile",
    email: "Email",
    upcoming: "Upcoming appointments",
    past: "Past appointments",
    noUpcoming: "No upcoming appointments.",
    clinicNote: "Note from the clinic",
    statuses: { new: "Awaiting confirmation", contacted: "Contacted", confirmed: "Confirmed", cancelled: "Cancelled" },
    signOut: "Sign out",
    close: "Close",
  },
  doctorsEyebrow: "Our Medical Team",
  doctorsHeading: "Doctors you can trust",
  doctorsIntro: "Specialist doctors you can book with directly — pick the one you prefer.",
  teamPhotoNote: "Real team photos coming soon",
  journeyEyebrow: "From First Contact to Full Glow",
  journeyHeading: "Your journey, one phase at a time",
  journeyPhases: [
    { step: "01", icon: "reachOut", name: "Reach Out", desc: "Book online now or give us a call" },
    { step: "02", icon: "book", name: "Book Appointment", desc: "We arrange the time that suits you" },
    { step: "03", icon: "diagnose", name: "Diagnosis", desc: "Careful exam, a plan built for you" },
    { step: "04", icon: "result", name: "Treatment & Result", desc: "Precise care, a radiant result" },
  ],
  booking: {
    eyebrow: "Book an Appointment",
    heading: "Book your visit in a minute",
    intro: "Choose the specialty, branch, day and time that suit you, and the branch team will contact you to confirm.",
    name: "Full name",
    phone: "Mobile number",
    email: "Email",
    service: "Specialty",
    branch: "Branch",
    date: "Preferred day",
    time: "Preferred time",
    pickDateFirst: "Pick a day to see the available times.",
    doctor: "Doctor",
    bookWith: "Book with",
    removeDoctor: "Remove doctor",
    unavailable: "That time is no longer available. Please pick another.",
    closedHint: "Times in red aren't available.",
    morning: "Morning",
    evening: "Evening",
    select: "Select...",
    submit: "Send booking request",
    sending: "Sending...",
    success: "Your request was received. We will contact you soon to confirm.",
    error: "We could not send your request. Please try again or contact us on WhatsApp.",
    invalid: "Please fill in every field and pick a day and time.",
  },
  wheel: {
    eyebrow: "Lucky Wheel",
    heading: "Spin and win a gift",
    intro: "Spin once a month to win one of our gifts: a free consultation, or a discount on crowns & bridges or orthodontics.",
    name: "Name",
    phone: "Mobile number",
    spin: "Spin the wheel",
    spinning: "Spinning…",
    won: "Congratulations! You won:",
    already: "Sorry, this number has already used its spin this month. You can try again next month. Your current prize:",
    code: "Prize code",
    validUntil: "Valid until",
    showCode: "Show this code at reception when you visit.",
    book: "Book your appointment",
    invalid: "Enter your name and a valid mobile number.",
    error: "Couldn't spin the wheel. Please try again.",
    terms: "One spin per mobile number per month. Prizes are personal and can't be transferred or exchanged for cash.",
  },
  testimonialsEyebrow: "What Our Patients Say",
  testimonialsHeading: "Trust we see in every visit",
  // Placeholder reviews — replace with real patient testimonials before launch.
  testimonials: [
    { name: "Reem A.", role: "Cosmetic Dentistry", quote: "A completely different experience — professional team, results beyond expectations." },
    { name: "Sultan M.", role: "Laser & Skin Cleansing", quote: "Precise scheduling and real attention to detail from the first visit." },
    { name: "Nouf S.", role: "Dermatology & Aesthetics", quote: "A calm setting and natural results, no exaggeration." },
  ],
  contactEyebrow: "Get in Touch",
  contactHeading: "Visit us in Taif",
  branchesLabel: "Our Branches",
  // Branch addresses are placeholders beyond the original Khamseen St. address — replace with exact addresses.
  branches: [
    { id: "khamseen", name: "Al-Khamseen Branch", address: "Al-Khamseen St, Al-Jal, Taif", mapUrl: mapUrls.khamseen },
    { id: "shahar", name: "Shahar Branch", address: "Shahar District, Taif", mapUrl: mapUrls.shahar },
    { id: "wisam", name: "Al-Wisam Branch", address: "Al-Wisam District, Taif", mapUrl: mapUrls.wisam },
  ],
  workingHoursValue: "Daily, 9 AM – 10 PM",
  phoneLabel: "Phone & WhatsApp",
  followLabel: "Follow Us",
  followValue: "Instagram · TikTok · Snapchat — @whitemoonclinic",
  mapPinTitle: "3 Branches in Taif",
  mapPinNote: "Approximate locations — will link to an interactive map in the final build",
  aboutEyebrow: "About Us",
  aboutHeading: "The White Moon Story",
  aboutBody1:
    "White Moon was founded to be a complete medical destination in Taif, bringing dentistry, dermatology and laser care together under one roof. We believe real care starts with listening to what you need, and ends in natural results that last.",
  aboutBody2:
    "The complex is staffed by specialist physicians using certified, up-to-date equipment, in a private and calm setting designed for your comfort from the first visit to the final result.",
  footerDesc: "A specialized dentistry, dermatology and laser complex in Taif.",
  footerSite: "Site",
  footerSpecialties: "Specialties",
  footerContact: "Contact",
  footerCopyright: "© 2026 White Moon Medical Complex. All rights reserved.",
  footerPreview: "Preliminary design preview",
  brandName: "White Moon",
  brandTagline: "Specialized Medical Complex",
  navItems: [
    { label: "Home", sectionId: "home" },
    { label: "Services", sectionId: "services" },
    { label: "Doctors", sectionId: "doctors" },
    { label: "About", sectionId: "about" },
    { label: "Contact", sectionId: "contact" },
  ],
};

export function contentFor(locale: Locale): Content {
  return locale === "ar" ? arContent : enContent;
}
