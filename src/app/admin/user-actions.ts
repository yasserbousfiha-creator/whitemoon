"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { type BranchId, BRANCHES } from "@/lib/booking-labels";
import { type Permissions, STAFF_EMAIL_DOMAIN, USERNAME_PATTERN, permissionsOf, toTabs } from "@/lib/staff-access";
import { createServiceClient, createStaffClient } from "@/lib/supabase";
import { currentStaff, requireSiteAdmin } from "./manager";
import type { UpdateResult } from "./actions";

// /admin → "المستخدمون": the site admin adds accounts (e.g. the call center), sets which sections each one opens and
// resets passwords. Every account can change its own password. Accounts are read and written with the server key,
// after the checks here.

export interface StaffUser {
  userId: string;
  username: string;
  name: string;
  branch: BranchId | null;
  isAdmin: boolean;
  /** Each section: hidden, view only, or view and edit. */
  permissions: Permissions;
  lastSignIn: string | null;
}

const MIN_PASSWORD = 6;
const cleanTabs = (p: unknown) => toTabs(p && typeof p === "object" ? (p as Record<string, unknown>) : {});
const cleanBranch = (b: unknown): BranchId | null => (typeof b === "string" && b in BRANCHES ? (b as BranchId) : null);

export async function listStaffUsers(): Promise<{ ok: true; users: StaffUser[] } | { ok: false; error: string }> {
  const who = await requireSiteAdmin();
  if ("error" in who) return { ok: false, error: who.error };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const [{ data: staff, error }, { data: auth }] = await Promise.all([db.from("staff").select("*"), db.auth.admin.listUsers({ perPage: 200 })]);
  if (error) return { ok: false, error: `تعذّر التحميل (${error.code ?? error.message}).` };
  const byId = new Map((auth?.users ?? []).map((u) => [u.id, u]));
  const users = (staff ?? []).map((s) => {
    const u = byId.get(s.user_id);
    const email = u?.email ?? "";
    return {
      userId: s.user_id as string,
      username: email.endsWith(`@${STAFF_EMAIL_DOMAIN}`) ? email.split("@")[0] : email,
      name: s.name as string,
      branch: cleanBranch(s.branch),
      isAdmin: !!s.is_admin,
      permissions: permissionsOf(s),
      lastSignIn: u?.last_sign_in_at ?? null,
    };
  });
  users.sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.name.localeCompare(b.name, "ar"));
  return { ok: true, users };
}

export interface NewStaffInput {
  username: string;
  name: string;
  password: string;
  branch: string | null;
  permissions: Partial<Permissions>;
}

export async function createStaffUser(input: NewStaffInput): Promise<UpdateResult> {
  const who = await requireSiteAdmin();
  if ("error" in who) return { ok: false, error: who.error };
  const username = String(input.username ?? "").trim().toLowerCase();
  const name = String(input.name ?? "").trim().slice(0, 80);
  const password = String(input.password ?? "");
  if (!USERNAME_PATTERN.test(username)) return { ok: false, error: "اسم المستخدم: حروف إنجليزية صغيرة وأرقام (3 أحرف على الأقل)." };
  if (name.length < 2) return { ok: false, error: "اكتب اسم الحساب." };
  if (password.length < MIN_PASSWORD) return { ok: false, error: `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل.` };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  const { data, error } = await db.auth.admin.createUser({ email: `${username}@${STAFF_EMAIL_DOMAIN}`, password, email_confirm: true });
  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return { ok: false, error: taken ? "اسم المستخدم مستخدم لحساب آخر." : `تعذّر إنشاء الحساب (${error?.message ?? ""}).` };
  }
  const { error: rowError } = await db.from("staff").insert({ user_id: data.user.id, name, branch: cleanBranch(input.branch), tabs: cleanTabs(input.permissions), is_admin: false });
  if (rowError) {
    await db.auth.admin.deleteUser(data.user.id); // don't leave a sign-in without a staff row
    return { ok: false, error: rowError.code === "42703" ? "شغّل ملف 013_staff_permissions.sql في Supabase أولًا." : `تعذّر الحفظ (${rowError.code ?? rowError.message}).` };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateStaffUser(userId: string, changes: { name?: string; branch?: string | null; permissions?: Partial<Permissions>; isAdmin?: boolean }): Promise<UpdateResult> {
  const who = await requireSiteAdmin();
  if ("error" in who) return { ok: false, error: who.error };
  if (typeof userId !== "string") return { ok: false, error: "طلب غير صالح." };
  // An admin can't take their own admin role away (someone has to keep managing the accounts).
  if (userId === who.userId && changes.isAdmin === false) return { ok: false, error: "لا يمكنك إزالة صلاحية الإدارة عن حسابك." };
  const update: Record<string, unknown> = {};
  if (typeof changes.name === "string" && changes.name.trim().length >= 2) update.name = changes.name.trim().slice(0, 80);
  if (changes.branch !== undefined) update.branch = cleanBranch(changes.branch);
  if (changes.permissions !== undefined) update.tabs = cleanTabs(changes.permissions);
  if (typeof changes.isAdmin === "boolean") update.is_admin = changes.isAdmin;
  if (!Object.keys(update).length) return { ok: true };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { error } = await db.from("staff").update(update).eq("user_id", userId);
  if (error) return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
  revalidatePath("/admin");
  return { ok: true };
}

/** The site admin sets a new password for any account. */
export async function resetStaffPassword(userId: string, password: string): Promise<UpdateResult> {
  const who = await requireSiteAdmin();
  if ("error" in who) return { ok: false, error: who.error };
  if (typeof password !== "string" || password.length < MIN_PASSWORD) return { ok: false, error: `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل.` };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { data: row } = await db.from("staff").select("user_id").eq("user_id", userId).maybeSingle();
  if (!row) return { ok: false, error: "الحساب غير موجود." };
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: `تعذّر الحفظ (${error.message}).` };
  return { ok: true };
}

/** Any account: its own password, after confirming the current one. */
export async function changeMyPassword(current: string, next: string): Promise<UpdateResult> {
  const who = await currentStaff();
  if ("error" in who) return { ok: false, error: who.error };
  if (typeof next !== "string" || next.length < MIN_PASSWORD) return { ok: false, error: `كلمة المرور الجديدة ${MIN_PASSWORD} أحرف على الأقل.` };
  const supabase = await createStaffClient();
  const { data: me } = await supabase.auth.getUser();
  const email = me.user?.email;
  if (!email) return { ok: false, error: "انتهت الجلسة، سجّل الدخول من جديد." };
  // Check the current password on a throwaway client, so the signed-in session is left alone.
  const check = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: wrong } = await check.auth.signInWithPassword({ email, password: String(current ?? "") });
  if (wrong) return { ok: false, error: "كلمة المرور الحالية غير صحيحة." };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, error: /different|same/i.test(error.message) ? "اختر كلمة مرور مختلفة عن الحالية." : `تعذّر الحفظ (${error.message}).` };
  return { ok: true };
}
