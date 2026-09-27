import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Patients read back their own bookings by the random token returned when they booked. POST keeps tokens out of URLs.
export async function POST(request: Request) {
  let body: { tokens?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const tokens = Array.isArray(body.tokens) ? body.tokens.filter((t): t is string => typeof t === "string" && UUID.test(t)) : [];
  if (tokens.length === 0 || tokens.length > 50) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });

  const { data, error } = await db
    .from("bookings")
    .select("public_token, status, notes, appointment_date, appointment_time")
    .in("public_token", tokens);
  if (error) {
    console.error("Booking status lookup failed:", error);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }

  return Response.json({
    ok: true,
    bookings: data.map((b) => ({
      token: b.public_token,
      status: b.status,
      notes: b.notes,
      date: b.appointment_date,
      time: b.appointment_time?.slice(0, 5) ?? null,
    })),
  });
}
