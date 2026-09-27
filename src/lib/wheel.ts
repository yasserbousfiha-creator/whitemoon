// Lucky wheel prizes. Ids match the wheel_spins.prize check in supabase/003_wheel.sql; keep labels in sync with
// whitemoon-app/src/lib/wheel.ts. Weights are relative odds (equal by default).
// `short` is the two-line label drawn on the wheel slice.
export const PRIZES = [
  { id: "prosthetics15", ar: "خصم 15% على التركيبات", en: "15% off crowns & bridges", shortAr: ["خصم 15%", "التركيبات"], shortEn: ["15% OFF", "Crowns"], weight: 1 },
  { id: "free_consult", ar: "كشف مجاني", en: "Free consultation", shortAr: ["كشف", "مجاني"], shortEn: ["FREE", "Consult"], weight: 1 },
  { id: "ortho10", ar: "خصم 10% على تقويم الأسنان", en: "10% off orthodontics", shortAr: ["خصم 10%", "التقويم"], shortEn: ["10% OFF", "Ortho"], weight: 1 },
] as const;

export type PrizeId = (typeof PRIZES)[number]["id"];

export const prizeLabel = (id: PrizeId, locale: "ar" | "en") => PRIZES.find((p) => p.id === id)![locale];

// The wheel shows each prize twice, alternating, so it reads as a real wheel rather than three wedges.
export const SLICES: PrizeId[] = [...PRIZES.map((p) => p.id), ...PRIZES.map((p) => p.id)];

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
