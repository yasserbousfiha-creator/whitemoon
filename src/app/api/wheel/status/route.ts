import { createServiceClient } from "@/lib/supabase";
import { monthEnd } from "@/lib/wheel";

export const runtime = "nodejs";

const CODE = /^WM-[A-Z0-9]{6}$/;

// The patient's saved prize codes → whether each is still valid or already used. The code itself is the secret,
// so nothing is returned for codes the caller doesn't already hold.
export async function POST(request: Request) {
  let body: { codes?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const codes = Array.isArray(body.codes) ? body.codes.filter((c): c is string => typeof c === "string" && CODE.test(c)) : [];
  if (codes.length === 0 || codes.length > 50) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });
  const { data, error } = await db.from("wheel_spins").select("code, prize, month, redeemed_at").in("code", codes);
  if (error) {
    console.error("Prize status lookup failed:", error);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
  return Response.json({
    ok: true,
    prizes: data.map((p) => ({ code: p.code, prize: p.prize, validUntil: monthEnd(p.month), redeemed: p.redeemed_at !== null })),
  });
}
