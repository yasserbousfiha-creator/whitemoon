import { randomInt } from "node:crypto";
import { createServiceClient } from "@/lib/supabase";
import { type Prize, monthEnd, normalizePhone, prizeName, riyadhMonth, toAsciiDigits } from "@/lib/wheel";
import { getWheelSettings } from "@/lib/wheel-server";

export const runtime = "nodejs";

// Unambiguous characters only (no 0/O, 1/I), so reception can read codes aloud.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode() {
  let code = "WM-";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return code;
}

function drawPrize(prizes: Prize[]): Prize {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = randomInt(total);
  for (const p of prizes) {
    if (roll < p.weight) return p;
    roll -= p.weight;
  }
  return prizes[0];
}

// Whether the wheel is shown, and its prizes (for the mobile app, which draws the same wheel).
export async function GET() {
  return Response.json({ ok: true, ...(await getWheelSettings()) });
}

// One spin per phone number per Riyadh month. Spinning again returns the prize already won, never a new draw.
// While the wheel is hidden from /admin, no spins are taken.
export async function POST(request: Request) {
  const settings = await getWheelSettings();
  if (!settings.enabled) return Response.json({ ok: false, error: "closed" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body.phone === "string" ? toAsciiDigits(body.phone).trim() : "";
  const phone = normalizePhone(rawPhone);
  if (name.length < 2 || name.length > 100 || !/^[+\d][\d\s-]{6,19}$/.test(rawPhone) || phone.length < 8) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });

  const month = riyadhMonth();
  const validUntil = monthEnd(month);
  // prize_ar/prize_en come with supabase/012_wheel_settings.sql; before it, "*" simply leaves them out.
  const existing = () => db.from("wheel_spins").select("*").eq("phone", phone).eq("month", month).maybeSingle();
  const reply = (spin: { prize: string; code: string; prize_ar?: string | null; prize_en?: string | null }, alreadySpun: boolean) =>
    Response.json({
      ok: true,
      alreadySpun,
      prize: spin.prize,
      prizeAr: prizeName(spin.prize, "ar", { ar: spin.prize_ar, en: spin.prize_en }, settings.prizes),
      prizeEn: prizeName(spin.prize, "en", { ar: spin.prize_ar, en: spin.prize_en }, settings.prizes),
      code: spin.code,
      validUntil,
    });

  const { data: already, error: lookupError } = await existing();
  if (lookupError) {
    console.error("Wheel lookup failed:", lookupError);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
  if (already) return reply(already, true);

  const prize = drawPrize(settings.prizes);
  // The prize's name is kept with the spin, since prizes can be renamed or removed from /admin later.
  let labels: { prize_ar?: string; prize_en?: string } = { prize_ar: prize.ar, prize_en: prize.en };
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = newCode();
    const { error } = await db.from("wheel_spins").insert({ month, name, phone, prize: prize.id, code, ...labels });
    if (!error) return reply({ prize: prize.id, code, prize_ar: prize.ar, prize_en: prize.en }, false);
    // PGRST204: the name columns aren't there yet (012_wheel_settings.sql not run); save without them.
    if (error.code === "PGRST204" && labels.prize_ar) {
      labels = {};
      attempt--;
      continue;
    }
    if (error.code !== "23505") {
      console.error("Wheel insert failed:", error);
      return Response.json({ ok: false, error: "server" }, { status: 500 });
    }
    // Unique violation: either a simultaneous spin for this phone (return it) or a code collision (retry).
    const { data: raced } = await existing();
    if (raced) return reply(raced, true);
  }
  return Response.json({ ok: false, error: "server" }, { status: 500 });
}
