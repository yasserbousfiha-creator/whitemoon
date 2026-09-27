"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { WheelSpin } from "@/lib/booking-labels";
import { normalizePhone, prizeLabel, riyadhMonth } from "@/lib/wheel";
import { redeemSpin } from "./actions";

const dateFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Riyadh",
});

function SpinCard({ spin }: { spin: WheelSpin }) {
  const [redeemedAt, markRedeemed] = useOptimistic(spin.redeemed_at, (_state, at: string) => at);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const expired = spin.month < riyadhMonth();

  return (
    <article className="rounded-2xl border border-line/25 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p dir="ltr" className="text-start font-mono text-lg font-bold tracking-widest text-gold">
            {spin.code}
          </p>
          <p className="font-bold">{prizeLabel(spin.prize, "ar")}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            redeemedAt ? "bg-stone-200 text-stone-600" : expired ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {redeemedAt ? "مستخدمة" : expired ? "منتهية" : "صالحة"}
        </span>
      </div>
      <p className="mt-2 text-sm">
        {spin.name} · <span dir="ltr">+{spin.phone}</span>
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        رُبحت {dateFormat.format(new Date(spin.created_at))}
        {redeemedAt ? ` · استُخدمت ${dateFormat.format(new Date(redeemedAt))}` : ""}
      </p>
      {!redeemedAt && !expired && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              markRedeemed(new Date().toISOString());
              const r = await redeemSpin(spin.id);
              if (!r.ok) setError(r.error);
            })
          }
          className="mt-3 rounded-full bg-gold-bright px-4 py-1.5 text-sm font-bold text-night2 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ…" : "تسجيل استخدام الجائزة"}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </article>
  );
}

// Reception types the code (or the patient's phone) to find a prize, then marks it used at the visit.
export default function SpinsPanel({ spins }: { spins: WheelSpin[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toUpperCase();
  const phoneQuery = normalizePhone(query);
  const shown = q
    ? spins.filter((s) => s.code.includes(q) || (phoneQuery.length >= 4 && s.phone.includes(phoneQuery)))
    : spins;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث برمز الجائزة أو رقم الجوال"
        className="w-full rounded-[10px] border border-line/40 bg-surface px-4 py-2.5 outline-none focus:border-gold-bright"
      />
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        {shown.length === 0 && <p className="text-ink-soft">لا توجد جوائز.</p>}
        {shown.map((s) => (
          <SpinCard key={s.id} spin={s} />
        ))}
      </section>
    </div>
  );
}
