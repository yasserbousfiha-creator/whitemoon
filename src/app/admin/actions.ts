"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STATUSES, type BookingStatus } from "@/lib/booking-labels";
import { createServiceClient, createStaffClient } from "@/lib/supabase";

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
