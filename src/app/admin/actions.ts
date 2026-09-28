"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STATUSES, type BookingStatus } from "@/lib/booking-labels";
import { type DoctorId, isDoctorId } from "@/lib/doctors";
import { createServiceClient, createStaffClient } from "@/lib/supabase";
import { type DashboardData, loadDashboard } from "./data";

export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "أدخل البريد الإلكتروني وكلمة المرور.";

  const supabase = await createStaffClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
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
export async function updateBooking(id: number, changes: { status?: BookingStatus; notes?: string }): Promise<UpdateResult> {
  if (!Number.isInteger(id)) return { ok: false, error: "طلب غير صالح." };

  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { ok: false, error: "انتهت الجلسة، سجّل الدخول من جديد." };

  const { data: visible } = await supabase.from("bookings").select("id").eq("id", id).maybeSingle();
  if (!visible) return { ok: false, error: "لا تملك صلاحية على هذا الحجز." };

  const update: Record<string, string | null> = { updated_at: new Date().toISOString(), updated_by: userId };
  if (changes.status && changes.status in STATUSES) update.status = changes.status;
  if (typeof changes.notes === "string") update.notes = changes.notes.trim().slice(0, 1000) || null;

  const db = createServiceClient();
  if (!db) return { ok: false, error: "الخادم غير مهيأ." };
  const { error } = await db.from("bookings").update(update).eq("id", id);
  if (error) {
    console.error("Booking update failed:", error);
    return { ok: false, error: `تعذّر الحفظ (${error.code ?? error.message}).` };
  }
  revalidatePath("/admin");
  return { ok: true };
}

// Marks a wheel prize as used. Any staff account may redeem (a patient can visit any branch); the staff session must be
// able to read the spin, and a code can only be redeemed once.
export async function redeemSpin(id: number): Promise<UpdateResult> {
  if (!Number.isInteger(id)) return { ok: false, error: "طلب غير صالح." };

  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { ok: false, error: "انتهت الجلسة، سجّل الدخول من جديد." };

  const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", userId).maybeSingle();
  if (!staff) return { ok: false, error: "هذا الحساب غير مسجّل كموظف." };

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

// Closes (or reopens) a whole day (start null) or a single 30-minute slot for one doctor, or for everyone ("all").
export async function setScheduleBlock(
  doctor: DoctorId | "all",
  date: string,
  start: string | null,
  closed: boolean,
): Promise<UpdateResult> {
  if (
    !(doctor === "all" || isDoctorId(doctor)) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    (start !== null && !/^\d{2}:\d{2}$/.test(start))
  ) {
    return { ok: false, error: "طلب غير صالح." };
  }

  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { ok: false, error: "انتهت الجلسة، سجّل الدخول من جديد." };
  const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", userId).maybeSingle();
  if (!staff) return { ok: false, error: "هذا الحساب غير مسجّل كموظف." };

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
  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;
  const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", userId).maybeSingle();
  if (!staff) return null;
  return loadDashboard(supabase);
}
