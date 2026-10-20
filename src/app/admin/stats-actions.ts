"use server";

import type { BranchId } from "@/lib/booking-labels";
import { createServiceClient } from "@/lib/supabase";
import { requireSiteAdmin } from "./manager";

// /admin → "الإحصائيات" (site admin only): what supabase/017_site_stats.sql's site_stats() counts since a moment.

export type StatsRange = "today" | "7d" | "30d" | "all";

export interface SiteStats {
  visitors: number; // different people
  visits: number; // sessions
  /** Per branch (null = the home page): opens / clicks and different people. */
  events: { type: "branch" | "book_click" | "whatsapp"; branch: BranchId | null; total: number; people: number }[];
  bookings: { branch: BranchId; total: number }[]; // booking forms actually sent
}

// Riyadh midnight today, or N days back from it; "all" = the beginning.
function since(range: StatsRange) {
  if (range === "all") return "2000-01-01T00:00:00Z";
  const riyadhToday = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
  const days = range === "today" ? 0 : range === "7d" ? 6 : 29;
  const start = new Date(`${riyadhToday}T00:00:00+03:00`);
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString();
}

export async function getSiteStats(range: StatsRange): Promise<{ ok: true; stats: SiteStats } | { ok: false; error: string }> {
  const who = await requireSiteAdmin();
  if ("error" in who) return { ok: false, error: "الإحصائيات لمدير الموقع فقط." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { data, error } = await db.rpc("site_stats", { since: since(range) });
  if (error) {
    console.error("Site stats failed:", error);
    if (error.code === "PGRST202" || error.code === "42883" || error.code === "42P01") {
      return { ok: false, error: "الإحصائيات تحتاج تشغيل ملف 017_site_stats.sql في Supabase." };
    }
    return { ok: false, error: `تعذّر التحميل (${error.code ?? error.message}).` };
  }
  return { ok: true, stats: data as SiteStats };
}
