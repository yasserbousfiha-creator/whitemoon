import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "./supabase";
import { DEFAULT_PRIZES, type WheelSettings, cleanPrizes } from "./wheel";

// Reads the wheel_settings row (supabase/012_wheel_settings.sql). Pages are prerendered with it and rebuilt when
// /admin saves (app/admin/wheel-actions.ts revalidates WHEEL_TAG).
export const WHEEL_TAG = "wheel";

// Until that SQL is run, or if the row can't be read, the wheel stays as it was: shown, with the original prizes.
const FALLBACK: WheelSettings = { enabled: true, prizes: DEFAULT_PRIZES };

export const getWheelSettings = unstable_cache(
  async (): Promise<WheelSettings> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return FALLBACK;
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from("wheel_settings").select("enabled, prizes").eq("id", 1).maybeSingle();
    if (error || !data) {
      if (error) console.error("Wheel settings lookup failed:", error);
      return FALLBACK;
    }
    return { enabled: data.enabled, prizes: cleanPrizes(data.prizes) ?? DEFAULT_PRIZES };
  },
  ["wheel-settings", "v1"],
  { tags: [WHEEL_TAG], revalidate: 300 },
);

// The saved settings, uncached, for the /admin editor (needs the server key). `missing` until the SQL is run.
export async function getWheelSettingsForAdmin(): Promise<{ settings: WheelSettings; error: string | null }> {
  const db = createServiceClient();
  if (!db) return { settings: FALLBACK, error: "config" };
  const { data, error } = await db.from("wheel_settings").select("enabled, prizes").eq("id", 1).maybeSingle();
  if (error) {
    console.error("Wheel settings lookup failed:", error);
    return { settings: FALLBACK, error: error.code === "42P01" || error.code === "PGRST205" ? "missing" : (error.code ?? error.message) };
  }
  if (!data) return { settings: FALLBACK, error: null };
  return { settings: { enabled: data.enabled, prizes: cleanPrizes(data.prizes) ?? DEFAULT_PRIZES }, error: null };
}
