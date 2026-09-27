"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STATUSES, type BookingStatus } from "@/lib/booking-labels";
import { createStaffClient } from "@/lib/supabase";

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

// Row level security rejects bookings outside the staff member's branch, and column grants block other fields.
export async function updateBooking(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = formData.get("status");
  const notes = formData.get("notes");
  if (!Number.isInteger(id)) return;

  const supabase = await createStaffClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/admin/login");

  const changes: Record<string, string | null> = { updated_at: new Date().toISOString(), updated_by: userId };
  if (typeof status === "string" && status in STATUSES) changes.status = status as BookingStatus;
  if (typeof notes === "string") changes.notes = notes.trim().slice(0, 1000) || null;

  const { error } = await supabase.from("bookings").update(changes).eq("id", id);
  if (error) console.error("Booking update failed:", error);
  revalidatePath("/admin");
}
