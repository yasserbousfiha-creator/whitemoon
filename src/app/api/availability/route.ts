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
  // Taken times come from Kizen alone: a website booking is only a request and never reserves a slot — it shows as
  // taken only once reception books it in Kizen (022_bookings_read_from_kizen_only). doctor_blocks are reception's
  // own manual closures, not bookings, so they still apply.
  const blocks = await db
    .from("doctor_blocks")
    .select("doctor, date, start_time")
    .in("doctor", [doctor.id, "all", `all-${doctor.branch}`])
    .gte("date", from)
    .lte("date", to);
  if (blocks.error) {
    console.error("Availability lookup failed:", blocks.error);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }

  // The doctor's busy times in Kizen at the branch (lib/kizen.ts), when that branch's agent is reporting.
  const kizen = await kizenTaken(db, doctor).catch(() => new Set<string>());
  const body: Availability = {
    blocks: blocks.data.map((b) => ({ doctor: b.doctor, date: b.date, start: b.start_time?.slice(0, 5) ?? null })),
    taken: [...kizen],
  };
  return Response.json({ ok: true, ...body }, { headers: { "Cache-Control": "no-store" } });
}
