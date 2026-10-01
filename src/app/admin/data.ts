import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, WheelSpin } from "@/lib/booking-labels";
import type { BlockTarget } from "@/lib/doctors";
import { riyadhToday } from "@/lib/slots";
import { createServiceClient } from "@/lib/supabase";
import { riyadhMonth } from "@/lib/wheel";

export type ScheduleBlockRow = { doctor: BlockTarget; date: string; start: string | null };

export interface DashboardData {
  bookings: Booking[];
  spins: WheelSpin[];
  blocks: ScheduleBlockRow[];
  bookingsError: string | null;
  spinsError: string | null;
  loadedAt: string; // ISO; shown as "last updated"
}

// Everything the dashboard shows. Call only after confirming the signed-in user is staff: bookings are read as the
// staff member (row level security limits a branch account to its branch); prizes and schedule blocks, which every
// staff account may see, are read with the server key.
export async function loadDashboard(staffClient: SupabaseClient): Promise<DashboardData> {
  const db = createServiceClient();
  const lastMonth = riyadhMonth(new Date(Date.now() - 31 * 24 * 60 * 60 * 1000));

  const columns =
    "id, created_at, name, phone, email, service, branch, source, status, notes, appointment_date, appointment_time, doctor, doctor_id";
  const readBookings = (cols: string) =>
    staffClient.from("bookings").select(cols).order("created_at", { ascending: false }).limit(500).returns<Booking[]>();

  const [withAttendance, spins, blocks] = await Promise.all([
    readBookings(columns + ", attendance"),
    db
      ? db
          .from("wheel_spins")
          .select("id, created_at, month, name, phone, prize, code, redeemed_at")
          .gte("month", lastMonth)
          .order("created_at", { ascending: false })
          .limit(1000)
          .returns<WheelSpin[]>()
      : null,
    db ? db.from("doctor_blocks").select("doctor, date, start_time").gte("date", riyadhToday()).order("date") : null,
  ]);

  // 42703: the attendance column isn't there yet (007_attendance.sql not run); show bookings without it.
  const bookings = withAttendance.error?.code === "42703" ? await readBookings(columns) : withAttendance;

  if (bookings.error) console.error("Bookings lookup failed:", bookings.error);
  if (spins?.error) console.error("Wheel spins lookup failed:", spins.error);
  if (blocks?.error) console.error("Schedule blocks lookup failed:", blocks.error);

  return {
    bookings: bookings.data ?? [],
    spins: spins?.data ?? [],
    blocks: (blocks?.data ?? []).map((b) => ({
      doctor: b.doctor as BlockTarget,
      date: b.date as string,
      start: (b.start_time as string | null)?.slice(0, 5) ?? null,
    })),
    bookingsError: bookings.error ? (bookings.error.code ?? bookings.error.message) : null,
    spinsError: !db ? "config" : spins?.error ? (spins.error.code ?? spins.error.message) : null,
    loadedAt: new Date().toISOString(),
  };
}
