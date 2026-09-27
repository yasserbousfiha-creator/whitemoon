import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "دخول الموظفين | وايت مون", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line/25 bg-surface p-8 shadow-[0_10px_30px_rgba(201,162,75,0.12)]">
        <p className="text-xs font-bold tracking-wide text-gold">وايت مون</p>
        <h1 className="font-display mt-1 text-2xl">لوحة الحجوزات</h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">خاصة بموظفي الاستقبال.</p>
        <LoginForm />
      </div>
    </main>
  );
}
