import { isDoctorId, type ScheduleBlock } from "@/lib/doctors";
import { DAYS_AHEAD, addDays, riyadhToday } from "@/lib/slots";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface Availability {
  blocks: Omit<ScheduleBlock, "id">[];
  taken: string[]; // "YYYY-MM-DD HH:MM" slots already booked
}

// Closed and booked slots for one doctor over the bookable window, so the booking form can show them in red.
// Contains no patient details.
export async function GET(request: Request) {
  const doctor = new URL(request.url).searchParams.get("doctor");
  if (!isDoctorId(doctor)) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });

  const from = riyadhToday();
  const to = addDays(from, DAYS_AHEAD);
  const [blocks, bookings] = await Promise.all([
    db
      .from("doctor_blocks")
      .select("doctor, date, start_time")
      .in("doctor", [doctor, "all"])
      .gte("date", from)
      .lte("date", to),
    db
      .from("bookings")
      .select("appointment_date, appointment_time")
      .eq("doctor_id", doctor)
      .neq("status", "cancelled")
      .gte("appointment_date", from)
      .lte("appointment_date", to),
  ]);
  if (blocks.error || bookings.error) {
    console.error("Availability lookup failed:", blocks.error ?? bookings.error);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }

  const body: Availability = {
    blocks: blocks.data.map((b) => ({ doctor: b.doctor, date: b.date, start: b.start_time?.slice(0, 5) ?? null })),
    taken: bookings.data.map((b) => `${b.appointment_date} ${String(b.appointment_time).slice(0, 5)}`),
  };
  return Response.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}
