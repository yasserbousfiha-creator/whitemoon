"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

const field =
  "mt-1.5 w-full rounded-[10px] border border-line/40 bg-bg px-3.5 py-2.5 text-base outline-none focus:border-gold-bright focus:ring-3 focus:ring-gold-bright/20";

export default function LoginForm() {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block text-xs font-bold text-ink-soft">
        البريد الإلكتروني
        <input name="email" type="email" autoComplete="username" required dir="ltr" className={field} />
      </label>
      <label className="block text-xs font-bold text-ink-soft">
        كلمة المرور
        <input name="password" type="password" autoComplete="current-password" required dir="ltr" className={field} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold-bright px-6 py-3 font-bold text-night2 transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "جارٍ الدخول…" : "دخول"}
      </button>
      <p role="alert" className="min-h-5 text-sm text-red-600">
        {error}
      </p>
    </form>
  );
}
