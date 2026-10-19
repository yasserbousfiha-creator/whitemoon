// Lucky wheel prizes. They live in the Supabase wheel_settings row (supabase/012_wheel_settings.sql), edited from
// /admin; DEFAULT_PRIZES is what the wheel had before, used until that SQL is run. Weights are relative odds.
// `shortAr`/`shortEn` are the two lines drawn on the wheel slice.
export interface Prize {
  id: string;
  ar: string;
  en: string;
  shortAr: [string, string];
  shortEn: [string, string];
  weight: number;
}

export interface WheelSettings {
  enabled: boolean; // shown on the site and accepting spins
  prizes: Prize[];
}

export const DEFAULT_PRIZES: Prize[] = [
  { id: "prosthetics15", ar: "خصم 15% على التركيبات", en: "15% off crowns & bridges", shortAr: ["خصم 15%", "التركيبات"], shortEn: ["15% OFF", "Crowns"], weight: 1 },
  { id: "free_consult", ar: "كشف مجاني", en: "Free consultation", shortAr: ["كشف", "مجاني"], shortEn: ["FREE", "Consult"], weight: 1 },
  { id: "ortho10", ar: "خصم 10% على تقويم الأسنان", en: "10% off orthodontics", shortAr: ["خصم 10%", "التقويم"], shortEn: ["10% OFF", "Ortho"], weight: 1 },
];

export const MIN_PRIZES = 2;
export const MAX_PRIZES = 6;

// Checks prizes coming from the database or the admin form; null when they can't be used.
export function cleanPrizes(input: unknown): Prize[] | null {
  if (!Array.isArray(input) || input.length < MIN_PRIZES || input.length > MAX_PRIZES) return null;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const lines = (v: unknown): [string, string] => (Array.isArray(v) ? [text(v[0], 14), text(v[1], 14)] : ["", ""]);
  const prizes: Prize[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = text(r.id, 40);
    const ar = text(r.ar, 80);
    const weight = Number(r.weight);
    if (!/^[a-z0-9_-]+$/.test(id) || ar.length < 2 || !Number.isInteger(weight) || weight < 1 || weight > 100) return null;
    const shortAr = lines(r.shortAr);
    if (!shortAr[0]) return null;
    const en = text(r.en, 80) || ar;
    const shortEn = lines(r.shortEn);
    prizes.push({ id, ar, en, shortAr, shortEn: shortEn[0] ? shortEn : shortAr, weight });
  }
  return new Set(prizes.map((p) => p.id)).size === prizes.length ? prizes : null;
}

// The prize's name: from the spin when it was saved with one (prizes can be renamed or removed later), else from the
// current or original prizes, else the id.
export function prizeName(
  id: string,
  locale: "ar" | "en",
  saved?: { ar?: string | null; en?: string | null },
  prizes: Prize[] = DEFAULT_PRIZES,
) {
  return saved?.[locale] || saved?.ar || [...prizes, ...DEFAULT_PRIZES].find((p) => p.id === id)?.[locale] || id;
}

// The slices drawn on the wheel: with up to four prizes each shows twice, alternating, so it reads as a real wheel.
export const slicesFor = (prizes: Prize[]) => (prizes.length <= 4 ? [...prizes, ...prizes] : prizes);

// Riyadh calendar month, "YYYY-MM"; the spin allowance resets on the 1st.
export function riyadhMonth(now = new Date()) {
  return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

// Last day of the given month, "YYYY-MM-DD": prizes are valid until the end of the month they were won.
export function monthEnd(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits, as phone keyboards often type them, become ASCII.
export function toAsciiDigits(s: string) {
  return s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
}

// One canonical form per Saudi mobile, so the once-a-month rule can't be dodged by retyping the same number:
// 05…, 5…, +9665…, 009665… and +966 05… (extra trunk zero) all become 9665…; other numbers keep their digits.
export function normalizePhone(phone: string) {
  let digits = toAsciiDigits(phone).replace(/\D/g, "").replace(/^00/, "");
  if (digits.startsWith("9660")) digits = `966${digits.slice(4)}`;
  if (digits.startsWith("05") && digits.length === 10) return `966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `966${digits}`;
  return digits;
}

// Stored 9665XXXXXXXX shown the way people write it locally: 05XXXXXXXX.
export const localPhone = (phone: string) => (phone.startsWith("966") ? `0${phone.slice(3)}` : phone);

// Digits typed into a search box (05…, 5…, +966…, Arabic-Indic) in the same local form, for partial matching.
export function localPhoneQuery(query: string) {
  const digits = toAsciiDigits(query).replace(/\D/g, "").replace(/^00/, "");
  if (digits.startsWith("9660")) return `0${digits.slice(4)}`;
  if (digits.startsWith("966")) return `0${digits.slice(3)}`;
  if (digits.startsWith("5")) return `0${digits}`;
  return digits;
}
