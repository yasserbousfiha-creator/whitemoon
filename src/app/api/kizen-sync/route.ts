import { branchForToken, saveSnapshot, type KizenSnapshot } from "@/lib/kizen";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The branch agent (Desktop\Lab\kizen-sync-agent) posts the busy times it read from Kizen: doctors' ids, names and
// start/end times only — no patient details. Its bearer token decides the branch (lib/kizen.ts).
const STAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const MAX_DOCTORS = 200;
const MAX_BUSY = 20_000;

export async function POST(request: Request) {
  const branch = branchForToken(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null);
  if (!branch) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const b = body as { generatedAt?: unknown; doctors?: unknown };
  if (!Array.isArray(b.doctors) || b.doctors.length > MAX_DOCTORS) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  let total = 0;
  const doctors: KizenSnapshot["doctors"] = [];
  for (const d of b.doctors as { id?: unknown; name?: unknown; busy?: unknown }[]) {
    if (typeof d?.id !== "number" || typeof d.name !== "string" || !Array.isArray(d.busy)) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
    const busy = (d.busy as unknown[]).filter(
      (x): x is [string, string] => Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "string" && STAMP.test(x[0]) && STAMP.test(x[1]) && x[0] < x[1],
    );
    total += busy.length;
    doctors.push({ id: d.id, name: d.name.slice(0, 120), busy });
  }
  if (total > MAX_BUSY) return Response.json({ ok: false, error: "too_large" }, { status: 413 });

  const db = createServiceClient();
  if (!db) return Response.json({ ok: false, error: "server" }, { status: 500 });
  const now = new Date().toISOString();
  try {
    await saveSnapshot(db, {
      branch,
      generatedAt: typeof b.generatedAt === "string" ? b.generatedAt.slice(0, 40) : now,
      receivedAt: now,
      doctors,
    });
  } catch (err) {
    console.error("Kizen snapshot save failed:", err);
    return Response.json({ ok: false, error: "server" }, { status: 500 });
  }
  return Response.json({ ok: true, branch, doctors: doctors.length, busy: total });
}
