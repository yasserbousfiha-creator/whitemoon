import { isBranchId } from "@/lib/branches";
import { createServiceClient } from "@/lib/supabase";
import { TRACK_TYPES, type TrackType } from "@/lib/track";

export const runtime = "nodejs";

const VISITOR = /^[A-Za-z0-9-]{8,64}$/;
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit/i;

// One anonymous site event (lib/track.ts) for /admin → "الإحصائيات". Never fails the page: bad input or a missing
// table (supabase/017_site_stats.sql not run yet) just records nothing.
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
  const { error } = await db
    .from("site_events")
    .insert({ type, visitor, branch: typeof branch === "string" && isBranchId(branch) ? branch : null });
  if (error) console.error("Site event insert failed:", error.code ?? error.message);
  return new Response(null, { status: 204 });
}
