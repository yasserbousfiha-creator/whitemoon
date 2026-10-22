import { clientIp, tooMany, withinLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";
import { monthEnd, prizeName } from "@/lib/wheel";

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
  // A patient holds one code a month; more than that, or many requests, is someone guessing codes.
  if (codes.length === 0 || codes.length > 20) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  if (!(await withinLimit(`wheel-status:ip:${clientIp(request.headers)}`, 60, 600))) return tooMany();

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });
  const { data, error } = await db.from("wheel_spins").select("*").in("code", codes);
  if (error) {
    console.error("Prize status lookup failed:", error);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
  return Response.json({
    ok: true,
    prizes: data.map((p) => ({
      code: p.code,
      prize: p.prize,
      prizeAr: prizeName(p.prize, "ar", { ar: p.prize_ar, en: p.prize_en }),
      prizeEn: prizeName(p.prize, "en", { ar: p.prize_ar, en: p.prize_en }),
      validUntil: monthEnd(p.month),
      redeemed: p.redeemed_at !== null,
    })),
  });
}
