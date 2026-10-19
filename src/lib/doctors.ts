// Doctors and their working hours (Riyadh time). They live in the Supabase `doctors` table, edited from the /admin
// "الأطباء" tab; lib/doctors-server.ts reads them. These helpers are pure so the booking form, the booking API and the
// /admin schedule tab share them. Slots are every 30 minutes from the start of each shift; the last one starts half
// an hour before the shift ends.
import type { BranchId, ServiceId } from "./booking-labels";

export type Shift = [start: string, end: string]; // "HH:MM"

// Shifts per weekday, 0 = Sunday … 6 = Saturday; a missing or empty day is a day off.
export type WeeklyHours = Partial<Record<number, Shift[]>>;

export interface Doctor {
  id: string; // slug, e.g. "ahmed-sobhi"; bookings and schedule blocks refer to it
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  // A short bio, one paragraph per line (shown in the app's doctor profile).
  bioAr: string;
  bioEn: string;
  // Other display names an older app version may send with a booking.
  aliases: string[];
  branch: BranchId; // choosing another branch drops the doctor
  service: ServiceId; // their department: choosing another one drops the doctor
  hours: WeeklyHours;
  photo: string | null; // square-ish photo (team carousel)
  portrait: string | null; // taller crop for the medical staff section; falls back to photo
  cases: string[]; // before/after photos of their patients
  sortOrder: number;
  active: boolean; // hidden doctors stay in the table but are not shown or bookable
}

export const DOCTOR_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const doctorNames = (d: Doctor) => [d.nameAr, d.nameEn, ...d.aliases];

// Older app versions send only the display name.
export function doctorByName(doctors: Doctor[], name: string | null | undefined) {
  if (!name) return null;
  return doctors.find((d) => doctorNames(d).includes(name.trim())) ?? null;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const weekday = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).getUTCDay();

// The shifts a doctor works on a given date (none on days off).
export function shiftsOn(d: Doctor, isoDate: string): Shift[] {
  return d.hours[weekday(isoDate)] ?? [];
}

// Whether any day has a morning and an evening shift, so pickers split slots by shift.
export const hasSplitShifts = (d: Doctor) => Object.values(d.hours).some((s) => (s?.length ?? 0) > 1);

// All slot start times the doctor works on that date (ignores time of day and blocks).
export function doctorSlots(d: Doctor, isoDate: string) {
  const slots: string[] = [];
  for (const [start, end] of shiftsOn(d, isoDate)) {
    for (let m = toMinutes(start); m <= toMinutes(end) - 30; m += 30) slots.push(toHHMM(m));
  }
  return slots;
}

// Admin-set unavailability: a whole day (start null) or one 30-minute slot.
// Who a block closes: one doctor (by id), every doctor in one branch ("all-khamseen"…), or everyone ("all").
export type BlockTarget = string;

export interface ScheduleBlock {
  id: number;
  doctor: BlockTarget;
  date: string;
  start: string | null; // "HH:MM"
}

// A slot is closed if a whole-day or matching-slot block covers it for this doctor, their branch, or everyone.
export function isBlocked(blocks: Pick<ScheduleBlock, "doctor" | "date" | "start">[], d: Doctor, date: string, time: string) {
  const who = [d.id, "all", `all-${d.branch}`];
  return blocks.some((b) => who.includes(b.doctor) && b.date === date && (b.start === null || b.start === time));
}

// Splits a day's slots by the doctor's shifts, so pickers can show "morning" and "evening" separately.
// Doctors with a single shift get one group.
export function groupByShift(d: Doctor, slots: string[], isoDate: string) {
  return shiftsOn(d, isoDate)
    .map(([start, end]) => slots.filter((s) => toMinutes(s) >= toMinutes(start) && toMinutes(s) < toMinutes(end)))
    .filter((group) => group.length > 0);
}

// Checks hours coming from the admin form: up to two shifts a day, "HH:MM" on the half hour, start before end, and
// a second shift after the first. Returns the cleaned hours or null.
export function cleanHours(input: unknown): WeeklyHours | null {
  if (!input || typeof input !== "object") return null;
  const out: WeeklyHours = {};
  const time = /^([01]\d|2[0-3]):(00|30)$/;
  for (let day = 0; day < 7; day++) {
    const shifts = (input as Record<string, unknown>)[day];
    if (shifts === undefined || (Array.isArray(shifts) && shifts.length === 0)) continue;
    if (!Array.isArray(shifts) || shifts.length > 2) return null;
    let lastEnd = -1;
    const clean: Shift[] = [];
    for (const s of shifts) {
      if (!Array.isArray(s) || s.length !== 2 || !time.test(s[0]) || !time.test(s[1])) return null;
      const [a, b] = [toMinutes(s[0]), toMinutes(s[1])];
      if (a >= b || a < lastEnd) return null;
      lastEnd = b;
      clean.push([s[0], s[1]]);
    }
    out[day] = clean;
  }
  return out;
}
