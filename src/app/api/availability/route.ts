import type { ScheduleBlock } from "@/lib/doctors";
import { getDoctors } from "@/lib/doctors-server";
import { DAYS_AHEAD, addDays, riyadhToday } from "@/lib/slots";
import { createServiceClient } from "@/lib/supabase";
import { kizenTaken } from "@/lib/kizen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface Availability {
  blocks: Omit<ScheduleBlock, "id">[];
  taken: string[]; // "YYYY-MM-DD HH:MM" slots already booked
}

// Closed and booked slots for one doctor over the bookable window, so the booking form can show them in red.
// Contains no patient details.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("doctor");
  const doctor = (await getDoctors()).find((d) => d.id === id);
  if (!doctor) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });

  const from = riyadhToday();
  const to = addDays(from, DAYS_AHEAD);
  const [blocks, bookings] = await Promise.all([
    db
      .from("doctor_blocks")
      .select("doctor, date, start_time")
      .in("doctor", [doctor.id, "all", `all-${doctor.branch}`])
      .gte("date", from)
      .lte("date", to),
    // Only a confirmed booking blocks the slot. A fresh request ('new') or one reception is still calling
    // ('contacted') leaves the time open to others until the appointment is confirmed (022_confirm_before_blocking).
    db
      .from("bookings")
      .select("appointment_date, appointment_time")
      .eq("doctor_id", doctor.id)
      .eq("status", "confirmed")
      .gte("appointment_date", from)
      .lte("appointment_date", to),
  ]);
  if (blocks.error || bookings.error) {
    console.error("Availability lookup failed:", blocks.error ?? bookings.error);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }

  // Plus the doctor's busy times in Kizen at the branch (lib/kizen.ts), when that branch's agent is reporting.
  const kizen = await kizenTaken(db, doctor).catch(() => new Set<string>());
  const body: Availability = {
    blocks: blocks.data.map((b) => ({ doctor: b.doctor, date: b.date, start: b.start_time?.slice(0, 5) ?? null })),
    taken: [...new Set([...bookings.data.map((b) => `${b.appointment_date} ${String(b.appointment_time).slice(0, 5)}`), ...kizen])],
  };
  return Response.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}
