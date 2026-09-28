import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { BranchId } from "@/lib/booking-labels";
import { createStaffClient, supabaseConfigured } from "@/lib/supabase";
import { signOut } from "./actions";
import Dashboard from "./Dashboard";
import { loadDashboard } from "./data";

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

  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("name, branch")
    .eq("user_id", userId)
    .maybeSingle();
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

  // The dashboard then keeps itself up to date through the refreshDashboard action.
  return (
    <Dashboard staff={{ name: staff.name, branch: staff.branch as BranchId | null }} initial={await loadDashboard(supabase)} />
  );
}
