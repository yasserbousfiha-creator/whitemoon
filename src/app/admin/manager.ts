import { createStaffClient } from "@/lib/supabase";
import { type AdminTab, type StaffAccess, canEdit } from "@/lib/staff-access";

// Shared by the doctors and offers actions. Kept out of the "use server" files so it is not callable from the browser.

export const PHOTO_BUCKET = "doctors";
const PUBLIC_MARKER = `/storage/v1/object/public/${PHOTO_BUCKET}/`;

/** The signed-in account's staff row (every column, so it works before 013_staff_permissions.sql too). */
export async function currentStaff(): Promise<{ userId: string; staff: StaffAccess & { name: string } } | { error: string }> {
  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { error: "انتهت الجلسة، سجّل الدخول من جديد." };
  const { data: staff } = await supabase.from("staff").select("*").eq("user_id", userId).maybeSingle();
  if (!staff) return { error: "هذا الحساب غير مسجّل كموظف." };
  return { userId, staff };
}

/** An account allowed to CHANGE things in one of these /admin sections ("view and edit" in its permissions, set from
 * "المستخدمون"); a view-only account gets an error. Every write action goes through this. */
export async function requireTab(...tabs: AdminTab[]): Promise<{ userId: string } | { error: string }> {
  const who = await currentStaff();
  if ("error" in who) return who;
  if (!tabs.some((t) => canEdit(who.staff, t))) return { error: "صلاحيتك على هذا القسم للعرض فقط." };
  return { userId: who.userId };
}

/** Adding accounts and setting their permissions: the site admin only. */
export async function requireSiteAdmin(): Promise<{ userId: string } | { error: string }> {
  const who = await currentStaff();
  if ("error" in who) return who;
  if (!who.staff.is_admin) return { error: "إدارة المستخدمين لمدير الموقع فقط." };
  return { userId: who.userId };
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
