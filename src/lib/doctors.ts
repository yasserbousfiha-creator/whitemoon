// Doctor working hours (Riyadh time), used by the booking form, the booking API and the /admin schedule tab.
// Keep in sync with whitemoon-app/src/lib/doctors.ts. Slots are every 30 minutes from the start of each shift; the
// last one starts half an hour before the shift ends.
export type DoctorId =
  "yasmine" | "fatima-alzahraa" | "ahmed-althubaiti" | "souad" | "ali-alkhalili" | "ahmed-sobhi" | "abdullah-alotaibi";

type Shift = [start: string, end: string]; // "HH:MM"

interface DoctorSchedule {
  names: string[]; // every display name (Arabic and English) that may arrive with a booking
  branch: "khamseen" | "shahar" | "wisam"; // where they work: choosing another branch drops the doctor
  service: "dentistry" | "derma" | "laser"; // their department: choosing another one drops the doctor
  days: number[]; // weekdays worked, 0 = Sunday … 6 = Saturday
  shifts: Shift[];
  // Hours that differ by weekday; overrides days/shifts when set.
  byDay?: Partial<Record<number, Shift[]>>;
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
// Clinic hours, for doctors whose own schedule hasn't been provided yet.
const CLINIC_HOURS: Shift[] = [["09:00", "22:00"]];

export const DOCTORS: Record<DoctorId, DoctorSchedule> = {
  yasmine: {
    names: ["د. ياسمين", "Dr. Yasmine"],
    branch: "khamseen",
    service: "derma",
    days: EVERY_DAY,
    shifts: [
      ["09:30", "12:30"],
      ["16:30", "21:30"],
    ],
  },
  souad: {
    names: ["د. سعاد", "Dr. Souad"],
    branch: "khamseen",
    service: "dentistry",
    days: EVERY_DAY,
    shifts: [
      ["09:30", "12:30"],
      ["16:30", "21:30"],
    ],
  },
  "fatima-alzahraa": {
    names: ["د. فاطمة الزهراء", "Dr. Fatima Al-Zahraa"],
    branch: "khamseen",
    service: "derma",
    days: EVERY_DAY,
    shifts: [["13:30", "21:30"]],
  },
  "ahmed-althubaiti": {
    names: ["أحمد الثبيتي", "Ahmed Al-Thubaiti", "د. أحمد الثبيتي", "Dr. Ahmed Al-Thubaiti"],
    branch: "khamseen",
    service: "derma",
    days: [0, 3], // Sunday and Wednesday
    shifts: [["17:00", "21:00"]],
  },
  "ali-alkhalili": {
    names: ["د. علي الخليلي", "Dr. Ali Al-Khalili"],
    branch: "khamseen",
    service: "dentistry",
    days: [0, 1, 2, 3, 4, 6],
    shifts: [["12:00", "21:00"]],
    // Saturday, Wednesday, Thursday 12–8 PM; Sunday, Monday, Tuesday 1–9 PM; no Friday.
    byDay: {
      6: [["12:00", "20:00"]],
      3: [["12:00", "20:00"]],
      4: [["12:00", "20:00"]],
      0: [["13:00", "21:00"]],
      1: [["13:00", "21:00"]],
      2: [["13:00", "21:00"]],
    },
  },
  "ahmed-sobhi": {
    names: ["د. أحمد صبحي", "Dr. Ahmed Sobhi"],
    branch: "khamseen",
    service: "dentistry",
    days: EVERY_DAY,
    shifts: [["13:00", "21:00"]],
  },
  "abdullah-alotaibi": {
    names: ["د. عبدالله العتيبي", "Dr. Abdullah Al-Otaibi"],
    branch: "khamseen",
    service: "dentistry",
    days: EVERY_DAY,
    shifts: CLINIC_HOURS,
  },
};

export const DOCTOR_IDS = Object.keys(DOCTORS) as DoctorId[];

export const isDoctorId = (v: unknown): v is DoctorId => typeof v === "string" && v in DOCTORS;

// Older app versions send only the display name.
export function doctorIdFromName(name: string | null | undefined): DoctorId | null {
  if (!name) return null;
  return DOCTOR_IDS.find((id) => DOCTORS[id].names.includes(name.trim())) ?? null;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const weekday = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).getUTCDay();

// All slot start times the doctor works on that date (ignores time of day and blocks).
// The shifts a doctor works on a given date (none on days off).
export function shiftsOn(id: DoctorId, isoDate: string): Shift[] {
  const d = DOCTORS[id];
  const day = weekday(isoDate);
  if (d.byDay) return d.byDay[day] ?? [];
  return d.days.includes(day) ? d.shifts : [];
}

export function doctorSlots(id: DoctorId, isoDate: string) {
  const slots: string[] = [];
  for (const [start, end] of shiftsOn(id, isoDate)) {
    for (let m = toMinutes(start); m <= toMinutes(end) - 30; m += 30) slots.push(toHHMM(m));
  }
  return slots;
}

// Admin-set unavailability: a whole day (start null) or one 30-minute slot. doctor "all" closes it for everyone.
export interface ScheduleBlock {
  id: number;
  doctor: DoctorId | "all";
  date: string;
  start: string | null; // "HH:MM"
}

// A slot is closed if a whole-day or matching-slot block covers it for this doctor or for all doctors.
export function isBlocked(blocks: Pick<ScheduleBlock, "doctor" | "date" | "start">[], id: DoctorId, date: string, time: string) {
  return blocks.some((b) => (b.doctor === id || b.doctor === "all") && b.date === date && (b.start === null || b.start === time));
}

// Splits a day's slots by the doctor's shifts, so pickers can show "morning" and "evening" separately.
// Doctors with a single shift get one group.
export function groupByShift(id: DoctorId, slots: string[], isoDate?: string) {
  return (isoDate ? shiftsOn(id, isoDate) : DOCTORS[id].shifts)
    .map(([start, end]) => slots.filter((s) => toMinutes(s) >= toMinutes(start) && toMinutes(s) < toMinutes(end)))
    .filter((group) => group.length > 0);
}
