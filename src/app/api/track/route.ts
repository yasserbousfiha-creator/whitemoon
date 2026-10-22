import { isBranchId } from "@/lib/branches";
import { clientIp, withinLimit } from "@/lib/rate-limit";
import { saveEvent } from "@/lib/site-stats-store";
import { createServiceClient } from "@/lib/supabase";
import { TRACK_TYPES, type TrackType } from "@/lib/track";

export const runtime = "nodejs";

const VISITOR = /^[A-Za-z0-9-]{8,64}$/;
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit/i;

// One anonymous site event (lib/track.ts) for /admin → "الإحصائيات", kept by lib/site-stats-store.ts. Never fails
// the page: bad input or a storage error just records nothing.
export async function POST(request: Request) {
  if (BOT.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  let body: { type?: unknown; branch?: unknown; visitor?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const { type, branch, visitor } = body;
  if (!TRACK_TYPES.includes(type as TrackType) || typeof visitor !== "string" || !VISITOR.test(visitor)) {
    return new Response(null, { status: 400 });
  }
  const db = createServiceClient();
  if (!db) return new Response(null, { status: 204 });
  // A real visitor sends a handful of events; past this, someone is inflating the numbers.
  if (!(await withinLimit(`track:ip:${clientIp(request.headers)}`, 100, 3600))) return new Response(null, { status: 204 });
  await saveEvent(db, type as TrackType, typeof branch === "string" && isBranchId(branch) ? branch : null, visitor);
  return new Response(null, { status: 204 });
}
