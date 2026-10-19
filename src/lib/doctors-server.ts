import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Doctor, WeeklyHours } from "./doctors";
import { createServiceClient } from "./supabase";

// Reads the `doctors` table (supabase/009_doctors.sql). The site's pages are prerendered with the visible doctors and
// rebuilt when /admin changes one (app/admin/doctor-actions.ts revalidates DOCTORS_TAG).
export const DOCTORS_TAG = "doctors";
export const DOCTORS_REVALIDATE_SECONDS = 300;

// Every column ("*"), so a column added by a later migration (bio_ar…) is simply missing until that SQL is run.
const DOCTOR_COLUMNS = "*";

export interface DoctorRow {
  id: string;
  name_ar: string;
  name_en: string;
  role_ar: string;
  role_en: string;
  bio_ar?: string; // supabase/010_doctor_bios.sql
  bio_en?: string;
  aliases: string[] | null;
  branch: Doctor["branch"];
  service: Doctor["service"];
  hours: WeeklyHours | null;
  photo: string | null;
  portrait: string | null;
  cases: string[] | null;
  sort_order: number;
  active: boolean;
}

export const fromRow = (r: DoctorRow): Doctor => ({
  id: r.id,
  nameAr: r.name_ar,
  nameEn: r.name_en,
  roleAr: r.role_ar,
  roleEn: r.role_en,
  bioAr: r.bio_ar ?? "",
  bioEn: r.bio_en ?? "",
  aliases: r.aliases ?? [],
  branch: r.branch,
  service: r.service,
  hours: r.hours ?? {},
  photo: r.photo,
  portrait: r.portrait,
  cases: r.cases ?? [],
  sortOrder: r.sort_order,
  active: r.active,
});

// Visible doctors, in display order. Read with the public key: row level security only exposes active doctors.
// Throws on a database error, so a failed rebuild keeps the previous page instead of publishing an empty team.
export const getDoctors = unstable_cache(
  async (): Promise<Doctor[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      console.error("Doctors: Supabase env vars are not set; showing no doctors.");
      return [];
    }
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from("doctors")
      .select(DOCTOR_COLUMNS)
      .eq("active", true)
      .order("sort_order")
      .order("name_ar")
      .returns<DoctorRow[]>();
    if (error) throw new Error(`Doctors lookup failed: ${error.code ?? error.message}`);
    return data.map(fromRow);
  },
  ["doctors", "v2"], // bump when the columns change: this cache outlives deployments
  // Also refreshed every 5 minutes, so changes made in Supabase directly (not through /admin) still show up.
  { tags: [DOCTORS_TAG], revalidate: DOCTORS_REVALIDATE_SECONDS },
);

// Every doctor including hidden ones, uncached, for the /admin editor (needs the server key).
export async function getAllDoctors(): Promise<{ doctors: Doctor[]; error: string | null }> {
  const db = createServiceClient();
  if (!db) return { doctors: [], error: "config" };
  const { data, error } = await db
    .from("doctors")
    .select(DOCTOR_COLUMNS)
    .order("sort_order")
    .order("name_ar")
    .returns<DoctorRow[]>();
  if (error) {
    console.error("Doctors lookup failed:", error);
    return { doctors: [], error: error.code ?? error.message };
  }
  return { doctors: data.map(fromRow), error: null };
}
