import { randomInt } from "node:crypto";
import { createServiceClient } from "@/lib/supabase";
import { PRIZES, type PrizeId, monthEnd, normalizePhone, riyadhMonth } from "@/lib/wheel";

export const runtime = "nodejs";

// Unambiguous characters only (no 0/O, 1/I), so reception can read codes aloud.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode() {
  let code = "WM-";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return code;
}

function drawPrize(): PrizeId {
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = randomInt(total);
  for (const p of PRIZES) {
    if (roll < p.weight) return p.id;
    roll -= p.weight;
  }
  return PRIZES[0].id;
}

// One spin per phone number per Riyadh month. Spinning again returns the prize already won, never a new draw.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = normalizePhone(rawPhone);
  if (name.length < 2 || name.length > 100 || !/^[+\d][\d\s-]{6,19}$/.test(rawPhone) || phone.length < 8) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });

  const month = riyadhMonth();
  const validUntil = monthEnd(month);
  const existing = () => db.from("wheel_spins").select("prize, code").eq("phone", phone).eq("month", month).maybeSingle();

  const { data: already, error: lookupError } = await existing();
  if (lookupError) {
    console.error("Wheel lookup failed:", lookupError);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
  if (already) return Response.json({ ok: true, alreadySpun: true, prize: already.prize, code: already.code, validUntil });

  const prize = drawPrize();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { error } = await db.from("wheel_spins").insert({ month, name, phone, prize, code });
    if (!error) return Response.json({ ok: true, alreadySpun: false, prize, code, validUntil });
    if (error.code !== "23505") {
      console.error("Wheel insert failed:", error);
      return Response.json({ ok: false, error: "server" }, { status: 500 });
    }
    // Unique violation: either a simultaneous spin for this phone (return it) or a code collision (retry).
    const { data: raced } = await existing();
    if (raced) return Response.json({ ok: true, alreadySpun: true, prize: raced.prize, code: raced.code, validUntil });
  }
  return Response.json({ ok: false, error: "server" }, { status: 500 });
}
