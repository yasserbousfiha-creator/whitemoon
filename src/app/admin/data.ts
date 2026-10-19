import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, WheelSpin } from "@/lib/booking-labels";
import type { BlockTarget, Doctor } from "@/lib/doctors";
import { getAllDoctors } from "@/lib/doctors-server";
import type { Offer } from "@/lib/offers";
import { getAllOffers } from "@/lib/offers-server";
import { riyadhToday } from "@/lib/slots";
import { createServiceClient } from "@/lib/supabase";
import { type WheelSettings, riyadhMonth } from "@/lib/wheel";
import { getWheelSettingsForAdmin } from "@/lib/wheel-server";

export type ScheduleBlockRow = { doctor: BlockTarget; date: string; start: string | null };

export interface DashboardData {
  bookings: Booking[];
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

  const [withExtras, spins, blocks, doctors, offers, wheel] = await Promise.all([
    readBookings(columns + ", attendance, offer"),
    db
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

  // 42703: a later column isn't there yet (007_attendance.sql / 011_offers.sql not run); show bookings without it.
  let bookings = withExtras;
  if (bookings.error?.code === "42703") bookings = await readBookings(columns + ", attendance");
  if (bookings.error?.code === "42703") bookings = await readBookings(columns);

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
    doctors: doctors.doctors,
    bookingsError: bookings.error ? (bookings.error.code ?? bookings.error.message) : null,
    spinsError: !db ? "config" : spins?.error ? (spins.error.code ?? spins.error.message) : null,
    doctorsError: doctors.error,
    offers: offers.offers,
    offersError: offers.error,
    wheel: wheel.settings,
    wheelError: wheel.error,
    loadedAt: new Date().toISOString(),
  };
}
