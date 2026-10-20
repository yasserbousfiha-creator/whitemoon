import type { SupabaseClient } from "@supabase/supabase-js";

// Where the anonymous site events (lib/track.ts) are kept: one empty file per event in a private storage bucket,
// its name carrying everything — "<riyadh day>/<type>.<branch|home>.<visitor>.<unique>". The server key creates the
// bucket on first use, so this needs no SQL (the user couldn't reach the SQL editor). Counting lists one folder per day.
export const STATS_BUCKET = "site-stats";

export const riyadhDay = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

export async function saveEvent(db: SupabaseClient, type: string, branch: string | null, visitor: string) {
  const path = `${riyadhDay()}/${type}.${branch ?? "home"}.${visitor}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const put = () => db.storage.from(STATS_BUCKET).upload(path, new Blob([""]), { contentType: "text/plain" });
  let { error } = await put();
  if (error && /not.?found/i.test(error.message)) {
    await db.storage.createBucket(STATS_BUCKET, { public: false });
    ({ error } = await put());
  }
  if (error) console.error("Site event save failed:", error.message);
}

export interface StatEvent {
  type: string;
  branch: string | null; // null = the home page
  visitor: string;
}

// Every event of these days (YYYY-MM-DD), or of every day stored when `days` is null.
export async function readEvents(db: SupabaseClient, days: string[] | null): Promise<StatEvent[]> {
  const bucket = db.storage.from(STATS_BUCKET);
  if (days === null) {
    const { data } = await bucket.list("", { limit: 1000 });
    days = (data ?? []).map((f) => f.name).filter((n) => /^\d{4}-\d{2}-\d{2}$/.test(n));
  }
  const perDay = await Promise.all(
    days.map(async (day) => {
      const names: string[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await bucket.list(day, { limit: 1000, offset });
        if (error || !data?.length) break;
        names.push(...data.map((f) => f.name));
        if (data.length < 1000) break;
      }
      return names;
    }),
  );
  return perDay.flat().flatMap((name) => {
    const [type, branch, visitor] = name.split(".");
    return type && branch && visitor ? [{ type, branch: branch === "home" ? null : branch, visitor }] : [];
  });
}
