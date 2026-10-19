import { createStaffClient } from "@/lib/supabase";

// Shared by the doctors and offers actions. Kept out of the "use server" files so it is not callable from the browser.

export const PHOTO_BUCKET = "doctors";
const PUBLIC_MARKER = `/storage/v1/object/public/${PHOTO_BUCKET}/`;

// Editing doctors and offers is for management accounts (staff.branch null), not a branch's reception.
export async function requireManager(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { error: "انتهت الجلسة، سجّل الدخول من جديد." };
  const { data: staff } = await supabase.from("staff").select("branch").eq("user_id", userId).maybeSingle();
  if (!staff) return { error: "هذا الحساب غير مسجّل كموظف." };
  if (staff.branch) return { error: "هذا القسم متاح لحساب الإدارة فقط." };
  return { userId };
}

// The bucket path of a photo uploaded from /admin; null for the photos that ship with the site (/images/…).
export function bucketPath(url: string | null | undefined) {
  return url?.includes(PUBLIC_MARKER) ? url.split(PUBLIC_MARKER)[1] : null;
}

// Only our own photos: uploaded to the bucket, or shipped with the site.
export function isOwnPhoto(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  if (/^\/images\/[\w./-]+$/.test(url)) return true;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!base && url.startsWith(`${base}${PUBLIC_MARKER}`);
}
