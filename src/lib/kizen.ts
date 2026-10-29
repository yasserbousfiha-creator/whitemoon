import { createHash, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BranchId } from "./booking-labels";
import { doctorNames, type Doctor } from "./doctors";
import { SLOT_MINUTES } from "./slots";

// Kizen (the clinic system, SQL Server on each branch's own server) → the booking form. A small agent on the branch
// server (Desktop\Lab\kizen-sync-agent) reads the busy appointment times — doctor + start/end, no patient details —
// and posts them to /api/kizen-sync. They're kept as one JSON file per branch in a private storage bucket (no SQL
// needed, like the site stats), and the booking form shows them as taken. Read only: nothing is written to Kizen.

export const KIZEN_BUCKET = "kizen-sync";

// On: the booking form shows Kizen's busy times (user's choice 2026-10-29). false = stored but not shown.
export const KIZEN_ENABLED = true;

// sha256 of each branch agent's token (the token itself lives only in the agent's config.json on that server).
const TOKEN_HASHES: Partial<Record<BranchId, string>> = {
  khamseen: "35b2d5d3b3ce2d461b148dfd7632fc782c114ed8303988c92fcd49e32e9ba3b5",
};

// An agent that stopped posting (server off, error) is ignored after this long: the form falls back to normal hours.
const STALE_MINUTES = 30;

/** Kizen doctor (ResourceID + its DrName) → its busy intervals, "YYYY-MM-DD HH:MM" Riyadh time. */
export interface KizenSnapshot {
  branch: BranchId;
  generatedAt: string; // ISO, from the agent
  receivedAt: string; // ISO, from us
  doctors: { id: number; name: string; busy: [string, string][] }[];
}

/** The branch a request's bearer token belongs to, or null. */
export function branchForToken(token: string | null): BranchId | null {
  if (!token) return null;
  const hash = Buffer.from(createHash("sha256").update(token).digest("hex"));
  for (const [branch, want] of Object.entries(TOKEN_HASHES)) {
    const w = Buffer.from(want!);
    if (w.length === hash.length && timingSafeEqual(w, hash)) return branch as BranchId;
  }
  return null;
}

export async function saveSnapshot(db: SupabaseClient, snap: KizenSnapshot) {
  const body = new Blob([JSON.stringify(snap)], { type: "application/json" });
  const put = () => db.storage.from(KIZEN_BUCKET).upload(`${snap.branch}.json`, body, { upsert: true, contentType: "application/json" });
  let { error } = await put();
  if (error && /not.?found/i.test(error.message)) {
    await db.storage.createBucket(KIZEN_BUCKET, { public: false });
    ({ error } = await put());
  }
  if (error) throw new Error(error.message);
  cache.delete(snap.branch);
}

// Read at most every 30 s per server instance — the agent posts every couple of minutes anyway.
const cache = new Map<BranchId, { at: number; snap: KizenSnapshot | null }>();

export async function readSnapshot(db: SupabaseClient, branch: BranchId): Promise<KizenSnapshot | null> {
  const hit = cache.get(branch);
  if (hit && Date.now() - hit.at < 30_000) return hit.snap;
  let snap: KizenSnapshot | null = null;
  try {
    const { data } = await db.storage.from(KIZEN_BUCKET).download(`${branch}.json`);
    if (data) snap = JSON.parse(await data.text()) as KizenSnapshot;
  } catch {
    snap = null;
  }
  if (snap && Date.now() - new Date(snap.receivedAt).getTime() > STALE_MINUTES * 60_000) snap = null;
  cache.set(branch, { at: Date.now(), snap });
  return snap;
}

// Names as written in Kizen ("د.ياسمين") and on the site ("د. ياسمين محمد") compared without titles, dots, spaces
// and letter variants.
export function normName(s: string) {
  return s
    .replace(/[ً-ْـ]/g, "") // harakat, tatweel
    .replace(/^\s*(د|دكتور|دكتورة|dr)\s*[./]?\s*/i, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.replace(/^ال(?=\p{L}{2})/u, "")) // "الخليلي" ↔ "خليلي"
    .join(" ");
}

/** The Kizen doctor for a site doctor: a name or alias equal to Kizen's, or else Kizen's name being the start of
 * the site name ("ياسمين" ↔ "ياسمين محمد") when that matches one doctor only. Add Kizen's spelling as an alias in
 * /admin when it doesn't match. */
export function kizenDoctorFor(snap: KizenSnapshot, doctor: Doctor) {
  const names = doctorNames(doctor).map(normName).filter(Boolean);
  const exact = snap.doctors.find((k) => names.includes(normName(k.name)));
  if (exact) return exact;
  const prefix = snap.doctors.filter((k) => {
    const n = normName(k.name);
    return n.length >= 3 && names.some((s) => s.startsWith(`${n} `));
  });
  return prefix.length === 1 ? prefix[0] : null;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** The site's slots ("YYYY-MM-DD HH:MM") that overlap one of this doctor's busy times in Kizen. */
export async function kizenTaken(db: SupabaseClient, doctor: Doctor): Promise<Set<string>> {
  const taken = new Set<string>();
  if (!KIZEN_ENABLED) return taken;
  const snap = await readSnapshot(db, doctor.branch);
  const k = snap && kizenDoctorFor(snap, doctor);
  if (!k) return taken;
  for (const [start, end] of k.busy) {
    // Walk the slot grid from the slot containing the start to the end (an all-day block spans to the next day).
    const day0 = start.slice(0, 10);
    let t = new Date(`${day0}T00:00:00Z`).getTime() + Math.floor(toMin(start.slice(11, 16)) / SLOT_MINUTES) * SLOT_MINUTES * 60_000;
    const stop = new Date(`${end.slice(0, 10)}T00:00:00Z`).getTime() + toMin(end.slice(11, 16)) * 60_000;
    for (let guard = 0; t < stop && guard < 2000; guard++, t += SLOT_MINUTES * 60_000) {
      const iso = new Date(t).toISOString();
      taken.add(`${iso.slice(0, 10)} ${iso.slice(11, 16)}`);
    }
  }
  return taken;
}
