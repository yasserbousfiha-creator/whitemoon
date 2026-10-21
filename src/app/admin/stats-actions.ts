"use server";

import { BRANCHES, type BranchId } from "@/lib/booking-labels";
import { readEvents, riyadhDay } from "@/lib/site-stats-store";
import { createServiceClient } from "@/lib/supabase";
import { requireSiteAdmin } from "./manager";

// /admin → "الإحصائيات" (site admin only): the anonymous site events (lib/site-stats-store.ts) and the bookings sent,
// counted for a period.

export type StatsRange = "today" | "7d" | "30d" | "all";

export interface SiteStats {
  visitors: number; // different people
  visits: number; // sessions
  /** Per branch (null = the home page): opens / clicks and different people. */
  events: { type: "branch" | "book_click" | "whatsapp"; branch: BranchId | null; total: number; people: number }[];
  bookings: { branch: BranchId; total: number }[]; // booking forms actually sent
  /** The same bookings per branch and doctor, most booked first; doctor null = booked without picking one. */
  byDoctor: { branch: BranchId; doctor: string | null; total: number }[];
}

// The bookings sent since a moment (branch and doctor only), a page at a time past the API's 1000-row cap.
async function bookingsSince(db: NonNullable<ReturnType<typeof createServiceClient>>, since: string) {
  const rows: { branch: BranchId; doctor: string | null; doctor_id: string | null }[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await db.from("bookings").select("branch, doctor, doctor_id").gte("created_at", since).range(from, from + 999);
    if (error || !data?.length) break;
    rows.push(...(data as typeof rows));
    if (data.length < 1000) break;
  }
  return rows;
}

// The Riyadh days in the period, newest first; null = every day stored.
function daysOf(range: StatsRange) {
  if (range === "all") return null;
  const count = range === "today" ? 1 : range === "7d" ? 7 : 30;
  return Array.from({ length: count }, (_, i) => riyadhDay(Date.now() - i * 86_400_000));
}

export async function getSiteStats(range: StatsRange): Promise<{ ok: true; stats: SiteStats } | { ok: false; error: string }> {
  const who = await requireSiteAdmin();
  if ("error" in who) return { ok: false, error: "الإحصائيات لمدير الموقع فقط." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const days = daysOf(range);
  const since = days ? `${days[days.length - 1]}T00:00:00+03:00` : "2000-01-01T00:00:00Z";
  const [events, booked, { data: doctors }] = await Promise.all([
    readEvents(db, days),
    bookingsSince(db, since),
    db.from("doctors").select("id, name_ar"),
  ]);
  // A booking names its doctor by id (older ones only by the name shown then); counted under today's Arabic name.
  const nameOf = new Map((doctors ?? []).map((d) => [d.id as string, d.name_ar as string]));
  const perDoctor = new Map<string, { branch: BranchId; doctor: string | null; total: number }>();
  for (const b of booked) {
    const doctor = (b.doctor_id && nameOf.get(b.doctor_id)) || b.doctor?.trim() || null;
    const key = `${b.branch}|${doctor}`;
    const g = perDoctor.get(key) ?? { branch: b.branch, doctor, total: 0 };
    g.total++;
    perDoctor.set(key, g);
  }
  const bookingCounts = (Object.keys(BRANCHES) as BranchId[]).map((branch) => ({
    branch,
    total: booked.filter((b) => b.branch === branch).length,
  }));

  const visits = events.filter((e) => e.type === "visit");
  const groups = new Map<string, { type: SiteStats["events"][number]["type"]; branch: BranchId | null; total: number; people: Set<string> }>();
  for (const e of events) {
    if (e.type === "visit") continue;
    const key = `${e.type}.${e.branch}`;
    const g = groups.get(key) ?? { type: e.type as SiteStats["events"][number]["type"], branch: e.branch as BranchId | null, total: 0, people: new Set() };
    g.total++;
    g.people.add(e.visitor);
    groups.set(key, g);
  }
  return {
    ok: true,
    stats: {
      visitors: new Set(visits.map((e) => e.visitor)).size,
      visits: visits.length,
      events: [...groups.values()].map((g) => ({ type: g.type, branch: g.branch, total: g.total, people: g.people.size })),
      bookings: bookingCounts,
      byDoctor: [...perDoctor.values()].sort((a, b) => b.total - a.total),
    },
  };
}
