"use client";

import { useState, useTransition } from "react";
import { MIN_PASSWORD } from "@/lib/staff-access";
import { changeMyPassword } from "./user-actions";

const field = "mt-1 w-full rounded-lg border border-line/40 bg-bg px-3 py-2 text-sm outline-none focus:border-gold-bright";

/** Any account changes its own password (the current one first). */
export default function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== again) return setError("كلمتا المرور الجديدتان غير متطابقتين.");
    start(async () => {
      const r = await changeMyPassword(current, next);
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4" onClick={() => !pending && onClose()}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-2xl bg-surface p-5 shadow-xl">
        <h2 className="font-display text-lg">تغيير كلمة المرور</h2>
        {done ? (
          <>
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">تم تغيير كلمة المرور. استخدمها في الدخول القادم.</p>
            <button type="button" onClick={onClose} className="w-full rounded-full bg-gold-bright py-2 text-sm font-bold text-night2">
              تم
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm">
              كلمة المرور الحالية
              <input id="pw-current" type="password" dir="ltr" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
            </label>
            <label className="block text-sm">
              كلمة المرور الجديدة ({MIN_PASSWORD} أحرف على الأقل)
              <input id="pw-next" type="password" dir="ltr" required minLength={MIN_PASSWORD} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
            </label>
            <label className="block text-sm">
              تأكيد كلمة المرور الجديدة
              <input id="pw-again" type="password" dir="ltr" required minLength={MIN_PASSWORD} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className={field} />
            </label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button disabled={pending} className="flex-1 rounded-full bg-gold-bright py-2 text-sm font-bold text-night2 disabled:opacity-50">
                {pending ? "جارٍ الحفظ…" : "حفظ"}
              </button>
              <button type="button" disabled={pending} onClick={onClose} className="rounded-full border border-line/40 px-5 py-2 text-sm">
                إلغاء
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
