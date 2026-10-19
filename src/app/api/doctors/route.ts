import { getDoctors } from "@/lib/doctors-server";

export const runtime = "nodejs";

// The visible doctors with their hours, for the mobile app (which still ships its own copy until it reads this).
export async function GET() {
  try {
    return Response.json({ ok: true, doctors: await getDoctors() });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
}
