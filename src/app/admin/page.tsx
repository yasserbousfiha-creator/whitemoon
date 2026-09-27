import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { Booking, BranchId, WheelSpin } from "@/lib/booking-labels";
import { createStaffClient, supabaseConfigured } from "@/lib/supabase";
import { riyadhMonth } from "@/lib/wheel";
import { signOut } from "./actions";
import AutoRefresh from "./AutoRefresh";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "لوحة الحجوزات | وايت مون", robots: { index: false } };

export default async function AdminPage() {
  // Always render per request: the data belongs to whoever is signed in.
  await connection();
  if (!supabaseConfigured) {
    return <p className="p-8 text-center">لم يتم ربط قاعدة البيانات بعد (متغيرات Supabase غير مضبوطة).</p>;
  }

  const supabase = await createStaffClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/admin/login");

  // Row level security limits a branch account to its own branch in both queries.
  // Wheel prizes from this month and last, so a code won late last month can still be looked up.
  const now = new Date();
  const lastMonth = riyadhMonth(new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000));
  const [{ data: staff, error: staffError }, { data: bookings, error }, { data: spins }] = await Promise.all([
    supabase.from("staff").select("name, branch").eq("user_id", userId).maybeSingle(),
    supabase
      .from("bookings")
      .select("id, created_at, name, phone, email, service, branch, source, status, notes, appointment_date, appointment_time")
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<Booking[]>(),
    supabase
      .from("wheel_spins")
      .select("id, created_at, month, name, phone, prize, code, redeemed_at")
      .gte("month", lastMonth)
      .order("created_at", { ascending: false })
      .limit(1000)
      .returns<WheelSpin[]>(),
  ]);

  if (!staff) {
    if (staffError) console.error("Staff lookup failed:", staffError);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-8 text-center">
        <p>
          {staffError
            ? `تعذّر التحقق من الحساب (${staffError.code ?? staffError.message}).`
            : "هذا الحساب غير مسجّل كموظف. اطلب من الإدارة إضافته."}
        </p>
        <form action={signOut}>
          <button className="rounded-full border border-line/40 px-5 py-2">تسجيل الخروج</button>
        </form>
      </main>
    );
  }

  if (error) console.error("Bookings lookup failed:", error);
  return (
    <>
      <AutoRefresh />
      {error ? (
        <p className="bg-red-50 p-3 text-center text-sm text-red-700">تعذّر تحميل الحجوزات ({error.code ?? error.message}).</p>
      ) : null}
      <Dashboard staff={{ name: staff.name, branch: staff.branch as BranchId | null }} bookings={bookings ?? []} spins={spins ?? []} />
    </>
  );
}
