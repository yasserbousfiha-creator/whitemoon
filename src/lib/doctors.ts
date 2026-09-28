// Doctor working hours (Riyadh time), used by the booking form, the booking API and the /admin schedule tab.
// Keep in sync with whitemoon-app/src/lib/doctors.ts. Slots are every 30 minutes from the start of each shift; the
// last one starts half an hour before the shift ends.
export type DoctorId = "yasmine" | "souad" | "fatima-alzahraa" | "ahmed-althubaiti";

type Shift = [start: string, end: string]; // "HH:MM"

interface DoctorSchedule {
  names: string[]; // every display name (Arabic and English) that may arrive with a booking
  days: number[]; // weekdays worked, 0 = Sunday … 6 = Saturday
  shifts: Shift[];
}

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

export const DOCTORS: Record<DoctorId, DoctorSchedule> = {
  yasmine: {
    names: ["د. ياسمين", "Dr. Yasmine"],
    days: EVERY_DAY,
    shifts: [
      ["09:30", "12:30"],
      ["16:30", "21:30"],
    ],
  },
  souad: {
    names: ["د. سعاد", "Dr. Souad"],
    days: EVERY_DAY,
    shifts: [
      ["09:30", "12:30"],
      ["16:30", "21:30"],
    ],
  },
  "fatima-alzahraa": {
    names: ["د. فاطمة الزهراء", "Dr. Fatima Al-Zahraa"],
    days: EVERY_DAY,
    shifts: [["13:30", "21:30"]],
  },
  "ahmed-althubaiti": {
    names: ["أحمد الثبيتي", "Ahmed Al-Thubaiti", "د. أحمد الثبيتي", "Dr. Ahmed Al-Thubaiti"],
    days: [0, 3], // Sunday and Wednesday
    shifts: [["17:00", "21:00"]],
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
export function doctorSlots(id: DoctorId, isoDate: string) {
  const d = DOCTORS[id];
  if (!d.days.includes(weekday(isoDate))) return [];
  const slots: string[] = [];
  for (const [start, end] of d.shifts) {
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
