import { createServiceClient } from "./supabase";

// Request limits for the public forms and the staff sign-in, counted in Supabase (supabase/018_security.sql), so they
// hold across all of Vercel's servers. Until that file is run, or if the count can't be read, everything is allowed:
// a limit must never stop a real patient from booking.

/** Counts one request for `key`; false once it has gone over `max` within `windowSeconds`. */
export async function withinLimit(key: string, max: number, windowSeconds: number) {
  const db = createServiceClient();
  if (!db) return true;
  const { data, error } = await db.rpc("rate_limit_hit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    // PGRST202: the function isn't there yet (018_security.sql not run).
    if (error.code !== "PGRST202") console.error("Rate limit check failed:", error);
    return true;
  }
  return data !== false;
}

/** The visitor's address as Vercel passes it on (it sets these headers itself, so they can't be forged). */
export function clientIp(headers: Headers) {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export const tooMany = () => Response.json({ ok: false, error: "busy" }, { status: 429 });
