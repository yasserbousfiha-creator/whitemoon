export type Locale = "ar" | "en";

export type ServiceExtraType = "shadeGuide" | "radianceBar" | "waveTags";
export type JourneyIcon = "reachOut" | "book" | "diagnose" | "result";

export interface QualityBadge {
  icon: "award" | "sparkle" | "smile" | "spa";
  title: string;
  subtitle: string;
}

export interface TeamMember {
  role: string;
  // No real staff photos yet — leave undefined to show a placeholder avatar.
  photoUrl?: string;
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
  select: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  invalid: string;
}

export interface ContestStrings {
  eyebrow: string;
  heading: string;
  intro: string;
  prizeLabel: string;
  prize: string;
  daysLeft: string;
  participants: string;
  winnerLabel: string;
  noWinner: string;
  demoNote: string;
  drawButton: string;
  noEntries: string;
  entered: string;
}

export interface Branch {
  id: "khamseen" | "shahar" | "wisam";
  name: string;
  address: string;
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
  teamPhotoNote: string;

  journeyEyebrow: string;
  journeyHeading: string;
  journeyPhases: JourneyPhase[];

  booking: BookingStrings;
  contest: ContestStrings;

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
      team: [{ role: "استشارية جلدية" }, { role: "أخصائية تجميل" }],
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
  teamPhotoNote: "الصور الفعلية للفريق ستُضاف قريبًا",
  journeyEyebrow: "من التواصل إلى الإشراقة",
  journeyHeading: "رحلتك معنا، خطوة بخطوة",
  journeyPhases: [
    { step: "01", icon: "reachOut", name: "التواصل", desc: "اتصل أو راسلنا عبر واتساب" },
    { step: "02", icon: "book", name: "حجز الموعد", desc: "نحدد لك أنسب وقت للزيارة" },
    { step: "03", icon: "diagnose", name: "التشخيص", desc: "فحص دقيق وخطة علاج مخصصة" },
    { step: "04", icon: "result", name: "العلاج والنتيجة", desc: "عناية دقيقة ونتيجة مشرقة" },
  ],
  booking: {
    eyebrow: "احجز موعدك",
    heading: "احجز زيارتك في دقيقة",
    intro: "اختر التخصص والفرع وأرسل بياناتك، وسيتواصل معك فريق الفرع لتأكيد الموعد.",
    name: "الاسم الكامل",
    phone: "رقم الجوال",
    email: "البريد الإلكتروني",
    service: "التخصص",
    branch: "الفرع",
    select: "اختر...",
    submit: "إرسال طلب الحجز",
    sending: "جارٍ الإرسال...",
    success: "تم استلام طلبك، سنتواصل معك قريبًا لتأكيد الموعد.",
    error: "تعذّر إرسال الطلب، حاول مرة أخرى أو تواصل معنا عبر واتساب.",
    invalid: "يرجى تعبئة جميع الحقول بشكل صحيح.",
  },
  contest: {
    eyebrow: "مسابقة الشهر",
    heading: "اشترِ خدمتك وادخل السحب على خدمة مجانية",
    intro: "كل من يحجز ويشتري خدمة من الموقع خلال الشهر يدخل السحب تلقائيًا، وفي نهاية الشهر نختار فائزًا واحدًا.",
    prizeLabel: "الجائزة",
    prize: "خدمة مجانية من اختيارك",
    daysLeft: "يوم على نهاية السحب",
    participants: "مشارك هذا الشهر",
    winnerLabel: "فائز هذا الشهر",
    noWinner: "لم يُحدَّد الفائز بعد",
    demoNote: "نسخة تجريبية: الشراء وهمي، والمشاركات تُحفظ في هذا المتصفح فقط.",
    drawButton: "سحب الفائز (تجريبي)",
    noEntries: "لا توجد مشاركات بعد. احجز خدمة لتكون أول المشاركين.",
    entered: "تم إدخالك في سحب هذا الشهر. رقم مشاركتك:",
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
    { id: "khamseen", name: "فرع الخمسين", address: "شارع الخمسين، الجال، الطائف" },
    { id: "shahar", name: "فرع شهار", address: "حي شهار، الطائف" },
    { id: "wisam", name: "فرع الوسام", address: "حي الوسام، الطائف" },
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
      team: [{ role: "Dermatology Consultant" }, { role: "Cosmetic Specialist" }],
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
  teamPhotoNote: "Real team photos coming soon",
  journeyEyebrow: "From First Contact to Full Glow",
  journeyHeading: "Your journey, one phase at a time",
  journeyPhases: [
    { step: "01", icon: "reachOut", name: "Reach Out", desc: "Call us or message on WhatsApp" },
    { step: "02", icon: "book", name: "Book Appointment", desc: "We arrange the time that suits you" },
    { step: "03", icon: "diagnose", name: "Diagnosis", desc: "Careful exam, a plan built for you" },
    { step: "04", icon: "result", name: "Treatment & Result", desc: "Precise care, a radiant result" },
  ],
  booking: {
    eyebrow: "Book an Appointment",
    heading: "Book your visit in a minute",
    intro: "Choose the specialty and branch, send your details, and the branch team will contact you to confirm.",
    name: "Full name",
    phone: "Mobile number",
    email: "Email",
    service: "Specialty",
    branch: "Branch",
    select: "Select...",
    submit: "Send booking request",
    sending: "Sending...",
    success: "Your request was received. We will contact you soon to confirm.",
    error: "We could not send your request. Please try again or contact us on WhatsApp.",
    invalid: "Please fill in all fields correctly.",
  },
  contest: {
    eyebrow: "Monthly Contest",
    heading: "Buy a service and enter the draw for a free one",
    intro: "Everyone who books and buys a service on the site this month is entered automatically, and at month end we pick one winner.",
    prizeLabel: "Prize",
    prize: "A free service of your choice",
    daysLeft: "days until the draw",
    participants: "entries this month",
    winnerLabel: "This month's winner",
    noWinner: "No winner drawn yet",
    demoNote: "Demo version: the purchase is simulated and entries are saved in this browser only.",
    drawButton: "Draw winner (demo)",
    noEntries: "No entries yet. Book a service to be the first.",
    entered: "You are entered in this month's draw. Your entry number:",
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
    { id: "khamseen", name: "Al-Khamseen Branch", address: "Al-Khamseen St, Al-Jal, Taif" },
    { id: "shahar", name: "Shahar Branch", address: "Shahar District, Taif" },
    { id: "wisam", name: "Al-Wisam Branch", address: "Al-Wisam District, Taif" },
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
    { label: "About", sectionId: "about" },
    { label: "Contact", sectionId: "contact" },
  ],
};

export function contentFor(locale: Locale): Content {
  return locale === "ar" ? arContent : enContent;
}
