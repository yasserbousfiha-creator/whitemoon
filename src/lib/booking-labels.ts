// Labels shared by the booking email and the /admin dashboard. Ids match the bookings table checks in supabase/schema.sql.
export const SERVICES = { dentistry: "طب الأسنان", derma: "الجلدية والتجميل", laser: "الليزر" } as const;
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
}

export interface WheelSpin {
  id: number;
  created_at: string;
  month: string;
  name: string;
  phone: string;
  prize: import("./wheel").PrizeId;
  code: string;
  redeemed_at: string | null;
}
