import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, WheelSpin } from "@/lib/booking-labels";
import type { BlockTarget, Doctor } from "@/lib/doctors";
import { getAllDoctors } from "@/lib/doctors-server";
import type { Offer } from "@/lib/offers";
import { getAllOffers } from "@/lib/offers-server";
import { riyadhToday } from "@/lib/slots";
import { type StaffAccess, canOpen } from "@/lib/staff-access";
import { createServiceClient } from "@/lib/supabase";
import { type WheelSettings, riyadhMonth } from "@/lib/wheel";
import { getWheelSettingsForAdmin } from "@/lib/wheel-server";

export type ScheduleBlockRow = { doctor: BlockTarget; date: string; start: string | null };
/** A booked slot as the doctors' schedule shows it (grey, with the patient's name). */
export type ScheduleBooking = Pick<
  Booking,
  "id" | "name" | "branch" | "doctor_id" | "appointment_date" | "appointment_time" | "status"
>;

export interface DashboardData {
  bookings: Booking[];
  scheduleBookings: ScheduleBooking[]; // every upcoming booked slot, however long ago it was booked
  spins: WheelSpin[];
  blocks: ScheduleBlockRow[];
  doctors: Doctor[]; // including hidden ones
  bookingsError: string | null;
  spinsError: string | null;
  doctorsError: string | null;
  offers: Offer[]; // including hidden and expired ones
  offersError: string | null;
  wheel: WheelSettings;
  wheelError: string | null; // "missing" until supabase/012_wheel_settings.sql is run
  loadedAt: string; // ISO; shown as "last updated"
}

// Everything the dashboard shows. Call only after confirming the signed-in user is staff, with that staff row: patient
// details (bookings, prizes) are loaded only for an account that may open those sections, since whatever is returned
// here reaches the browser whether or not the tab is shown. Bookings are read as the staff member (row level security
// limits a branch account to its branch); prizes and schedule blocks are read with the server key.
export async function loadDashboard(staffClient: SupabaseClient, staff: StaffAccess): Promise<DashboardData> {
  const db = createServiceClient();
  const lastMonth = riyadhMonth(new Date(Date.now() - 31 * 24 * 60 * 60 * 1000));
  const showBookings = canOpen(staff, "bookings");
  const showSpins = canOpen(staff, "spins");

  const columns =
    "id, created_at, name, phone, email, service, branch, source, status, notes, appointment_date, appointment_time, doctor, doctor_id, updated_at, updated_by";
  const readBookings = (cols: string) =>
    staffClient.from("bookings").select(cols).order("created_at", { ascending: false }).limit(500).returns<Booking[]>();

  const [withExtras, upcoming, spins, blocks, doctors, offers, wheel] = await Promise.all([
    showBookings ? readBookings(columns + ", attendance, attendance_at, offer, status_by, status_at, attendance_by") : null,
    // Apart from the latest 500 above, so a slot booked long ago still shows as taken.
    canOpen(staff, "schedule")
      ? staffClient
          .from("bookings")
          .select("id, name, branch, doctor_id, appointment_date, appointment_time, status")
          .gte("appointment_date", riyadhToday())
          .neq("status", "cancelled")
          .not("doctor_id", "is", null)
          .returns<ScheduleBooking[]>()
      : null,
    db && showSpins
      ? db
          .from("wheel_spins")
          .select("*")
          .gte("month", lastMonth)
          .order("created_at", { ascending: false })
          .limit(1000)
          .returns<WheelSpin[]>()
      : null,
    db ? db.from("doctor_blocks").select("doctor, date, start_time").gte("date", riyadhToday()).order("date") : null,
    getAllDoctors(),
    getAllOffers(),
    getWheelSettingsForAdmin(),
  ]);

  // 42703: a later column isn't there yet (007_attendance / 011_offers / 020_booking_actors.sql not run); show bookings without it.
  let bookings = withExtras;
  if (bookings?.error?.code === "42703") bookings = await readBookings(columns + ", attendance, attendance_at, offer");
  if (bookings?.error?.code === "42703") bookings = await readBookings(columns + ", attendance");
  if (bookings?.error?.code === "42703") bookings = await readBookings(columns);

  // Who did what: the staff names behind status_by / attendance_by / updated_by.
  if (bookings?.data?.length && db) {
    const ids = [...new Set(bookings.data.flatMap((b) => [b.status_by, b.attendance_by, b.updated_by]).filter((x): x is string => !!x))];
    if (ids.length) {
      const { data: people } = await db.from("staff").select("user_id, name").in("user_id", ids);
      const name = new Map((people ?? []).map((p) => [p.user_id as string, p.name as string]));
      for (const b of bookings.data) {
        b.status_by_name = (b.status_by && name.get(b.status_by)) || null;
        b.attendance_by_name = (b.attendance_by && name.get(b.attendance_by)) || null;
        b.updated_by_name = (b.updated_by && name.get(b.updated_by)) || null;
      }
    }
  }

  if (bookings?.error) console.error("Bookings lookup failed:", bookings.error);
  if (upcoming?.error) console.error("Upcoming bookings lookup failed:", upcoming.error);
  if (spins?.error) console.error("Wheel spins lookup failed:", spins.error);
  if (blocks?.error) console.error("Schedule blocks lookup failed:", blocks.error);
  const bookingsFailed = bookings?.error ?? upcoming?.error;

  return {
    bookings: bookings?.data ?? [],
    scheduleBookings: upcoming?.data ?? [],
    spins: spins?.data ?? [],
    blocks: (blocks?.data ?? []).map((b) => ({
      doctor: b.doctor as BlockTarget,
      date: b.date as string,
      start: (b.start_time as string | null)?.slice(0, 5) ?? null,
    })),
    doctors: doctors.doctors,
    bookingsError: bookingsFailed ? (bookingsFailed.code ?? bookingsFailed.message) : null,
    spinsError: !showSpins ? null : !db ? "config" : spins?.error ? (spins.error.code ?? spins.error.message) : null,
    doctorsError: doctors.error,
    offers: offers.offers,
    offersError: offers.error,
    wheel: wheel.settings,
    wheelError: wheel.error,
    loadedAt: new Date().toISOString(),
  };
}
