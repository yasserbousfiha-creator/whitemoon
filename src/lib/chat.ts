// The chat assistant's understanding of a typed message, without any AI service: it looks for a doctor's name, a
// day, a department, a branch and a few topic words (offers, hours, booking…) in Arabic or English, and picks what
// to answer. Pure, so it can be tried out apart from the chat window (components/ChatAssistant.tsx).
import type { BranchId, ServiceId } from "./booking-labels";
import { type Doctor, doctorNames, weekday } from "./doctors";
import { riyadhToday } from "./offers";

export type Intent =
  | { kind: "doctors"; ids: string[]; day: number | null } // one id: their hours; several: "which one?"
  | { kind: "department"; service: ServiceId; branch: BranchId | null }
  | { kind: "offers"; service: ServiceId | null; prices: boolean }
  | { kind: "pickDoctor" }
  | { kind: "branches"; branch: BranchId | null }
  | { kind: "hours" }
  | { kind: "book" }
  | { kind: "contact" }
  | { kind: "greeting" }
  | { kind: "thanks" }
  | { kind: "unknown" };

// Lower case, no diacritics or tatweel, one alef, ة as ه, punctuation as spaces. ى stays apart from ي so the
// preposition "على" is not taken for Dr. Ali.
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "الخليلي" → "خليلي", so names match with or without the article.
const stripArticle = (w: string) => (w.startsWith("ال") && w.length > 4 ? w.slice(2) : w);

const words = (text: string) => normalize(text).split(" ").filter(Boolean);

// Titles and short particles never count as part of a name.
const NOT_NAMES = new Set(["دكتور", "دكتوره", "طبيب", "طبيبه", "dr", "doctor", "al", "el", "abu", "ابو"]);

const nameWords = (d: Doctor) =>
  new Set(
    doctorNames(d)
      .flatMap(words)
      .map(stripArticle)
      .filter((w) => w.length >= 3 && !NOT_NAMES.has(w)),
  );

// A typed word is a name word, or it with a leading و/ب/ل ("وسعاد", "لسعاد").
const sameWord = (typed: string, name: string) =>
  typed === name || (typed.length === name.length + 1 && /^[وبل]/.test(typed) && typed.slice(1) === name);

// The doctors whose names share the most words with the message (none if no word matches).
export function findDoctors(text: string, doctors: Doctor[]) {
  const typed = words(text).map(stripArticle);
  let best = 0;
  let found: Doctor[] = [];
  for (const d of doctors) {
    const names = nameWords(d);
    const score = [...names].filter((n) => typed.some((w) => sameWord(w, n))).length;
    if (score === 0 || score < best) continue;
    if (score > best) found = [];
    best = score;
    found.push(d);
  }
  return found;
}

const DAYS: Record<string, number> = {
  احد: 0, sunday: 0,
  اثنين: 1, اتنين: 1, monday: 1,
  ثلاثاء: 2, ثلاثا: 2, tuesday: 2,
  اربعاء: 3, اربعا: 3, wednesday: 3,
  خميس: 4, thursday: 4,
  جمعه: 5, friday: 5,
  سبت: 6, saturday: 6,
};

// The weekday a message asks about ("الخميس", "today", "بكره"), Riyadh time, or null.
export function findDay(text: string): number | null {
  const raw = words(text);
  const today = weekday(riyadhToday());
  if (raw.some((w) => ["اليوم", "today", "الحين", "الان", "now"].includes(w))) return today;
  if (raw.some((w) => ["بكره", "بكرا", "غدا", "باكر", "tomorrow"].includes(w))) return (today + 1) % 7;
  for (const w of raw.map(stripArticle)) if (w in DAYS) return DAYS[w];
  return null;
}

// Word stems per topic; a message matches when its normalized text contains one.
const SERVICE_WORDS: [ServiceId, string[]][] = [
  ["laser", ["ليزر", "ازاله الشعر", "laser", "hair removal"]],
  ["dentistry", ["اسنان", "سنان", "ضرس", "تقويم", "زراعه", "تبييض", "حشو", "عصب", "تركيب", "ابتسامه", "لثه", "dent", "teeth", "tooth", "ortho", "implant", "whitening", "braces"]],
  ["derma", ["جلد", "بشره", "تجميل", "بوتكس", "بوتوكس", "فيلر", "نضاره", "هايدرا", "derma", "skin", "botox", "filler", "hydra"]],
  ["gynecology", ["نساء", "ولاده", "حمل", "نسائيه", "gyn", "pregnan", "obstet"]],
  ["pediatrics", ["اطفال", "طفل", "رضيع", "pediatr", "child", "kid", "baby"]],
  ["general", ["طب عام", "طبيب عام", "طبيبه عامه", "باطنه", "general practi", " gp "]],
];
const BRANCH_WORDS: [BranchId, string[]][] = [
  ["khamseen", ["خمسين", "الجال", "khamseen", "khamsin"]],
  ["shahar", ["شهار", "shahar"]],
  ["wisam", ["وسام", "wisam", "wesam"]],
];
const TOPIC = {
  offers: ["عرض", "عروض", "خصم", "تخفيض", "تخفيضات", "باقه", "باقات", "offer", "discount", "promo", "deal", "sale"],
  prices: ["سعر", "اسعار", "بكم", "كم يكلف", "تكلفه", "price", "cost", "how much"],
  branches: ["فرع", "فروع", "موقع", "مواقع", "عنوان", "لوكيشن", "وين", "مكان", "خريطه", "location", "address", "branch", "where", "map"],
  hours: ["دوام", "ساعات", "مواعيد", "متى", "متي", "تفتح", "تقفل", "تسكر", "hours", "open", "close", "timing", "schedule"],
  book: ["حجز", "احجز", "موعد", "book", "appointment", "reserv"],
  contact: ["واتس", "تواصل", "رقم", "جوال", "اتصال", "اتصل", "هاتف", "تلفون", "whatsapp", "call", "phone", "contact", "number"],
  doctors: ["دكتور", "دكاتره", "طبيب", "اطباء", "دكتوره", "doctor", "dr "],
  greeting: ["سلام", "مرحبا", "هلا", "اهلا", "صباح", "مساء", "hello", "hi ", "hey"],
  thanks: ["شكرا", "مشكور", "يعطيك العافيه", "جزاك", "thank", "thx"],
};

export function understand(text: string, doctors: Doctor[]): Intent {
  // Padded so stems ending in a space ("hi ", "dr ") also match at the end.
  const t = ` ${normalize(text)} `;
  const has = (stems: string[]) => stems.some((s) => t.includes(s));
  const service = SERVICE_WORDS.find(([, stems]) => has(stems))?.[0] ?? null;
  const branch = BRANCH_WORDS.find(([, stems]) => has(stems))?.[0] ?? null;

  const named = findDoctors(text, doctors);
  if (named.length > 0) {
    const inBranch = branch ? named.filter((d) => d.branch === branch) : [];
    return { kind: "doctors", ids: (inBranch.length ? inBranch : named).map((d) => d.id), day: findDay(text) };
  }
  if (has(TOPIC.offers) || has(TOPIC.prices)) return { kind: "offers", service, prices: !has(TOPIC.offers) };
  if (service) return { kind: "department", service, branch };
  if (has(TOPIC.branches) || branch) return { kind: "branches", branch };
  if (has(TOPIC.doctors)) return { kind: "pickDoctor" };
  if (has(TOPIC.hours)) return { kind: "hours" };
  if (has(TOPIC.book)) return { kind: "book" };
  if (has(TOPIC.contact)) return { kind: "contact" };
  if (has(TOPIC.thanks)) return { kind: "thanks" };
  if (has(TOPIC.greeting)) return { kind: "greeting" };
  return { kind: "unknown" };
}
