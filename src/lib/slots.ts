// Appointment slots, in Riyadh time (UTC+3, no DST). Keep in sync with whitemoon-app/src/lib/slots.ts.
// Without a doctor, hours match "daily 9 AM – 10 PM"; with one, their own shifts (lib/doctors.ts). The last slot
// starts 30 minutes before closing.
import { type DoctorId, doctorSlots } from "./doctors";

export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 22;
export const SLOT_MINUTES = 30;
export const DAYS_AHEAD = 30;
// Same-day slots must start at least this long from now, so the branch has time to confirm.
const LEAD_MINUTES = 60;

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

function riyadhNow(now = new Date()) {
  const r = new Date(now.getTime() + RIYADH_OFFSET_MS);
  return { date: r.toISOString().slice(0, 10), minutes: r.getUTCHours() * 60 + r.getUTCMinutes() };
}

export const riyadhToday = (now = new Date()) => riyadhNow(now).date;

const pad = (n: number) => String(n).padStart(2, "0");

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ISO dates (YYYY-MM-DD) that still have at least one open slot, starting today.
export function bookableDays(now = new Date(), doctor: DoctorId | null = null) {
  const today = riyadhNow(now).date;
  const days: string[] = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    if (timeSlots(day, now, doctor).length > 0) days.push(day);
  }
  return days;
}

// "HH:MM" slot start times on the given day (clinic hours, or the doctor's shifts), minus any starting too soon.
export function timeSlots(isoDate: string, now = new Date(), doctor: DoctorId | null = null) {
  const { date: today, minutes: nowMinutes } = riyadhNow(now);
  let all: string[];
  if (doctor) all = doctorSlots(doctor, isoDate);
  else {
    all = [];
    for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += SLOT_MINUTES) all.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  if (isoDate !== today) return all;
  return all.filter((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m >= nowMinutes + LEAD_MINUTES;
  });
}

export function isBookable(isoDate: string, time: string, now = new Date(), doctor: DoctorId | null = null) {
  return bookableDays(now, doctor).includes(isoDate) && timeSlots(isoDate, now, doctor).includes(time);
}

// Weekday + day + month for a slot day, e.g. "الأحد 28 سبتمبر"; the date is read as a calendar day, not a UTC instant.
export function formatDay(isoDate: string, locale: "ar" | "en", opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

// "09:30" → "9:30 ص" / "9:30 AM", with a no-break space so the suffix never wraps onto its own line.
export function formatTime(time: string, locale: "ar" | "en") {
  const [h, m] = time.split(":").map(Number);
  const suffix = locale === "ar" ? (h < 12 ? "ص" : "م") : h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${pad(m)} ${suffix}`;
}
