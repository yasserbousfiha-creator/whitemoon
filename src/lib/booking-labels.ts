// Labels shared by the booking email and the /admin dashboard. Ids match the bookings table checks in supabase/schema.sql.
export const SERVICES = {
  dentistry: "طب الأسنان",
  derma: "الجلدية والتجميل",
  laser: "الليزر",
  gynecology: "النساء والولادة",
  pediatrics: "طب الأطفال",
  general: "الطب العام",
} as const;
export const BRANCHES = { khamseen: "فرع الخمسين", shahar: "فرع شهار", wisam: "فرع الوسام" } as const;
export const STATUSES = { new: "جديد", contacted: "تم التواصل", confirmed: "مؤكد", cancelled: "ملغي" } as const;
export const ATTENDANCE = { attended: "حضر", no_show: "لم يحضر" } as const;

export type ServiceId = keyof typeof SERVICES;
export type BranchId = keyof typeof BRANCHES;
export type BookingStatus = keyof typeof STATUSES;
export type Attendance = keyof typeof ATTENDANCE;

export interface Booking {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  service: ServiceId;
  branch: BranchId;
  source: "web" | "app";
  status: BookingStatus;
  notes: string | null;
  appointment_date: string | null;
  appointment_time: string | null; // "HH:MM:SS"
  doctor: string | null;
  doctor_id: string | null;
  attendance?: Attendance | null; // missing until supabase/007_attendance.sql is run
  offer?: string | null; // the offer's title when booked from one (supabase/011_offers.sql)
  // Who did what (supabase/020_booking_actors.sql; updated_by = the last change of any kind).
  updated_at?: string | null;
  updated_by?: string | null;
  status_by?: string | null;
  status_at?: string | null;
  attendance_by?: string | null;
  attendance_at?: string | null;
  // Staff names for the ids above, filled in by the dashboard loader.
  status_by_name?: string | null;
  attendance_by_name?: string | null;
  updated_by_name?: string | null;
}

export interface WheelSpin {
  id: number;
  created_at: string;
  month: string;
  name: string;
  phone: string;
  prize: string;
  prize_ar?: string | null; // the name when won; missing until supabase/012_wheel_settings.sql is run
  prize_en?: string | null;
  code: string;
  redeemed_at: string | null;
}
