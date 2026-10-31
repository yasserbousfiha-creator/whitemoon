"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ATTENDANCE, STATUSES, type Attendance, type BookingStatus } from "@/lib/booking-labels";
import { type BlockTarget, DOCTOR_ID_PATTERN } from "@/lib/doctors";
import { getAllDoctors } from "@/lib/doctors-server";
import { STAFF_EMAIL_DOMAIN, canEdit } from "@/lib/staff-access";
import { clientIp, withinLimit } from "@/lib/rate-limit";
import { createServiceClient, createStaffClient } from "@/lib/supabase";
import { type DashboardData, loadDashboard } from "./data";
import { currentStaff, requireTab } from "./manager";

/** Staff sign in with a plain username (e.g. "admin"); Supabase Auth still needs
 * an email, so a username maps to a synthetic, non-routable one. A real email
 * still works as-is. */
export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const login = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!login || !password) return "أدخل اسم المستخدم وكلمة المرور.";
  const email = login.includes("@") ? login : `${login}@${STAFF_EMAIL_DOMAIN}`;

  // Against guessing passwords: a few tries per account, and per connection across accounts.
  const ip = clientIp(await headers());
  if (!(await withinLimit(`login:user:${email}`, 5, 900)) || !(await withinLimit(`login:ip:${ip}`, 20, 900))) {
    return "محاولات كثيرة. انتظر ربع ساعة ثم حاول مرة أخرى.";
  }

  const supabase = await createStaffClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "اسم المستخدم أو كلمة المرور غير صحيحة.";
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createStaffClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

// Access is checked by reading the booking as the staff member (row level security hides other branches); the write
// then goes through the service client and can only touch status and notes. A staff-session UPDATE blocked by RLS
// reports success with zero rows, which is why saves could silently do nothing before.
export async function updateBooking(
  id: number,
  changes: { status?: BookingStatus; notes?: string; attendance?: Attendance | null },
): Promise<UpdateResult> {
  if (!Number.isInteger(id)) return { ok: false, error: "طلب غير صالح." };

  const gate = await requireTab("bookings");
  if ("error" in gate) return { ok: false, error: gate.error };
  const userId = gate.userId;
  const supabase = await createStaffClient();

  const { data: visible } = await supabase.from("bookings").select("id").eq("id", id).maybeSingle();
  if (!visible) return { ok: false, error: "لا تملك صلاحية على هذا الحجز." };

  const now = new Date().toISOString();
  const update: Record<string, string | null> = { updated_at: now, updated_by: userId };
  // Who did it, shown on the booking's card (020_booking_actors.sql).
  const actors: Record<string, string | null> = {};
  if (changes.status && changes.status in STATUSES) {
    update.status = changes.status;
    actors.status_by = userId;
    actors.status_at = now;
  }
  if (typeof changes.notes === "string") update.notes = changes.notes.trim().slice(0, 1000) || null;
  if (changes.attendance === null || (changes.attendance && changes.attendance in ATTENDANCE)) {
    update.attendance = changes.attendance;
    update.attendance_at = changes.attendance ? now : null;
    actors.attendance_by = changes.attendance ? userId : null;
  }

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  let { error } = await db.from("bookings").update({ ...update, ...actors }).eq("id", id);
  // 020_booking_actors.sql not run yet: save the change without who-did-it (updated_by still records it).
  if (error && Object.keys(actors).length && (error.code === "PGRST204" || error.code === "42703")) {
    ({ error } = await db.from("bookings").update(update).eq("id", id));
  }
  if (error) {
    console.error("Booking update failed:", error);
    if (error.code === "PGRST204" || error.code === "42703") {
      return { ok: false, error: "تسجيل الحضور يحتاج تشغيل ملف 007_attendance.sql في Supabase." };
    }
    return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
  }
  revalidatePath("/admin");
  return { ok: true };
}

// Removes a booking for good (old or test bookings). The site admin only: there is no undo.
export async function deleteBooking(id: number): Promise<UpdateResult> {
  if (!Number.isInteger(id)) return { ok: false, error: "طلب غير صالح." };
  const who = await currentStaff();
  if ("error" in who) return { ok: false, error: who.error };
  if (!who.staff.is_admin) return { ok: false, error: "حذف الحجوزات لمدير الموقع فقط." };
  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { error } = await db.from("bookings").delete().eq("id", id);
  if (error) {
    console.error("Booking delete failed:", error);
    return { ok: false, error: `تعذّر الحذف (${error.code ?? error.message}).` };
  }
  revalidatePath("/admin");
  return { ok: true };
}

// Marks a wheel prize as used. Any account with the prizes section may redeem any branch's code (a patient can visit
// any branch); a code can only be redeemed once.
export async function redeemSpin(id: number): Promise<UpdateResult> {
  if (!Number.isInteger(id)) return { ok: false, error: "طلب غير صالح." };

  const gate = await requireTab("spins");
  if ("error" in gate) return { ok: false, error: gate.error };
  const userId = gate.userId;

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { data: updated, error } = await db
    .from("wheel_spins")
    .update({ redeemed_at: new Date().toISOString(), redeemed_by: userId })
    .eq("id", id)
    .is("redeemed_at", null)
    .select("id");
  if (error) {
    console.error("Spin redeem failed:", error);
    return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
  }
  if (!updated?.length) return { ok: false, error: "هذه الجائزة مستخدمة مسبقاً." };
  revalidatePath("/admin");
  return { ok: true };
}

// Closes (or reopens) a whole day (start null) or a single 30-minute slot for one doctor, for every doctor of a
// branch ("all-khamseen"…), or for everyone ("all").
export async function setScheduleBlock(
  doctor: BlockTarget,
  date: string,
  start: string | null,
  closed: boolean,
): Promise<UpdateResult> {
  if (
    !(doctor === "all" || /^all-(khamseen|shahar|wisam)$/.test(doctor) || DOCTOR_ID_PATTERN.test(doctor)) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    (start !== null && !/^\d{2}:\d{2}$/.test(start))
  ) {
    return { ok: false, error: "طلب غير صالح." };
  }

  const who = await currentStaff();
  if ("error" in who) return { ok: false, error: who.error };
  if (!canEdit(who.staff, "schedule")) return { ok: false, error: "صلاحيتك على هذا القسم للعرض فقط." };
  const userId = who.userId;

  // A branch account only opens and closes its own branch: never "all", another branch, or another branch's doctor.
  const own = who.staff.branch;
  if (own) {
    const doctorBranch = doctor.startsWith("all")
      ? doctor.slice(4)
      : (await getAllDoctors()).doctors.find((d) => d.id === doctor)?.branch;
    if (doctorBranch !== own) return { ok: false, error: "لا تملك صلاحية على جدول فرع آخر." };
  }

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };

  if (closed) {
    const { error } = await db.from("doctor_blocks").insert({ doctor, date, start_time: start, created_by: userId });
    // 23505: already closed, which is what was asked for.
    if (error && error.code !== "23505") {
      console.error("Block insert failed:", error);
      return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
    }
  } else {
    let q = db.from("doctor_blocks").delete().eq("doctor", doctor).eq("date", date);
    q = start === null ? q.is("start_time", null) : q.eq("start_time", start);
    const { error } = await q;
    if (error) {
      console.error("Block delete failed:", error);
      return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
    }
  }
  revalidatePath("/admin");
  return { ok: true };
}

// Fresh dashboard data for the client's periodic refresh (see Dashboard.tsx); null when not signed in as staff.
export async function refreshDashboard(): Promise<DashboardData | null> {
  const who = await currentStaff();
  if ("error" in who) return null;
  return loadDashboard(await createStaffClient(), who.staff);
}
