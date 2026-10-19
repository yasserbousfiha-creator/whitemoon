// What each /admin account may open, and whether it may change anything there (supabase/013_staff_permissions.sql).
// Pure — used by the server checks and the dashboard alike.
//
// staff.tabs holds one entry per section the account opens: "offers" = view and edit, "offers:view" = view only
// (user's choice 2026-10-19: e.g. the call center sees the live offers to answer patients, but never adds, edits or
// hides one). A section not listed is hidden. null = the defaults for the account's branch.

export const ADMIN_TABS = ["bookings", "spins", "schedule", "doctors", "offers", "wheel"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];
export type Access = "none" | "view" | "edit";
export type Permissions = Record<AdminTab, Access>;

export const TAB_LABELS: Record<AdminTab, string> = {
  bookings: "الحجوزات",
  spins: "جوائز العجلة (الأكواد)",
  schedule: "جدول الأطباء",
  doctors: "الأطباء",
  offers: "العروض",
  wheel: "إعدادات العجلة",
};

/** What "edit" allows in each section (shown in the permissions editor). */
export const EDIT_MEANS: Record<AdminTab, string> = {
  bookings: "تغيير حالة الحجز والملاحظات والحضور",
  spins: "استخدام كود الجائزة",
  schedule: "إغلاق وفتح الأيام والمواعيد",
  doctors: "إضافة وتعديل وحذف وترتيب الأطباء",
  offers: "إضافة وتعديل وإخفاء وحذف العروض",
  wheel: "تعديل الجوائز وتشغيل العجلة",
};

export interface StaffAccess {
  branch: string | null;
  is_admin?: boolean | null;
  tabs?: string[] | null;
}

/** Without a saved choice: a management account (all branches) edits everything; a branch's reception does the daily work. */
export function defaultPermissions(branch: string | null): Permissions {
  const all = (a: Access) => Object.fromEntries(ADMIN_TABS.map((t) => [t, a])) as Permissions;
  return branch ? { ...all("none"), bookings: "edit", spins: "edit", schedule: "edit" } : all("edit");
}

export function permissionsOf(s: StaffAccess): Permissions {
  if (s.is_admin) return defaultPermissions(null);
  if (!Array.isArray(s.tabs)) return defaultPermissions(s.branch);
  return Object.fromEntries(
    ADMIN_TABS.map((t) => [t, s.tabs!.includes(t) ? "edit" : s.tabs!.includes(`${t}:view`) ? "view" : "none"]),
  ) as Permissions;
}

/** Back to the stored form. */
export function toTabs(p: Partial<Record<string, unknown>>): string[] {
  return ADMIN_TABS.flatMap((t) => (p[t] === "edit" ? [t] : p[t] === "view" ? [`${t}:view`] : []));
}

export const canOpen = (s: StaffAccess, tab: AdminTab) => permissionsOf(s)[tab] !== "none";
export const canEdit = (s: StaffAccess, tab: AdminTab) => permissionsOf(s)[tab] === "edit";

/** A staff login name: lower-case latin letters, digits, dot, dash, underscore. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;

/** Staff sign in with a plain username; Supabase Auth still needs an email, so it maps to this non-routable domain. */
export const STAFF_EMAIL_DOMAIN = "staff.whitemoonclinic.local";
