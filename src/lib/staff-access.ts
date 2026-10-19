// What each /admin account may open (supabase/013_staff_permissions.sql). Pure — used by the server checks and the
// dashboard's tabs alike.

export const ADMIN_TABS = ["bookings", "spins", "schedule", "doctors", "offers", "wheel"] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];

export const TAB_LABELS: Record<AdminTab, string> = {
  bookings: "الحجوزات",
  spins: "جوائز العجلة (الأكواد)",
  schedule: "جدول الأطباء",
  doctors: "الأطباء",
  offers: "العروض",
  wheel: "إعدادات العجلة",
};

export interface StaffAccess {
  branch: string | null;
  is_admin?: boolean | null;
  tabs?: string[] | null;
}

/** Without a saved choice: a management account (all branches) sees everything; a branch's reception the daily work. */
export function defaultTabs(branch: string | null): AdminTab[] {
  return branch ? ["bookings", "spins", "schedule"] : [...ADMIN_TABS];
}

export function staffTabs(s: StaffAccess): AdminTab[] {
  if (s.is_admin) return [...ADMIN_TABS];
  if (!Array.isArray(s.tabs)) return defaultTabs(s.branch);
  return ADMIN_TABS.filter((t) => s.tabs!.includes(t));
}

export const canOpen = (s: StaffAccess, tab: AdminTab) => staffTabs(s).includes(tab);

/** A staff login name: lower-case latin letters, digits, dot, dash, underscore. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;

/** Staff sign in with a plain username; Supabase Auth still needs an email, so it maps to this non-routable domain. */
export const STAFF_EMAIL_DOMAIN = "staff.whitemoonclinic.local";
