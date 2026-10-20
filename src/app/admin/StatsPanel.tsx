"use client";

import { useEffect, useState } from "react";
import { BRANCHES, type BranchId } from "@/lib/booking-labels";
import { type SiteStats, type StatsRange, getSiteStats } from "./stats-actions";

const RANGES: [StatsRange, string][] = [
  ["today", "اليوم"],
  ["7d", "آخر 7 أيام"],
  ["30d", "آخر 30 يوم"],
  ["all", "الكل"],
];

const n = (v: number) => v.toLocaleString("ar-SA-u-nu-latn");

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line/25 bg-surface p-4">
      <p className="text-xs font-bold text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl">{n(value)}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Visitors, branch pages opened, booking-button and WhatsApp clicks and bookings sent, for a period. */
export default function StatsPanel() {
  const [range, setRange] = useState<StatsRange>("7d");
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The period the numbers on screen are for; differs from `range` while the new ones load.
  const [loaded, setLoaded] = useState<StatsRange | null>(null);
  const loading = loaded !== range;

  useEffect(() => {
    let live = true;
    getSiteStats(range).then((r) => {
      if (!live) return;
      setLoaded(range);
      if (r.ok) {
        setStats(r.stats);
        setError(null);
      } else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [range]);

  const sum = (type: string, branch?: BranchId | null, key: "total" | "people" = "total") =>
    (stats?.events ?? [])
      .filter((e) => e.type === type && (branch === undefined || e.branch === branch))
      .reduce((a, e) => a + Number(e[key]), 0);
  const booked = (branch?: BranchId) =>
    (stats?.bookings ?? []).filter((b) => branch === undefined || b.branch === branch).reduce((a, b) => a + Number(b.total), 0);
  const branches = Object.keys(BRANCHES) as BranchId[];

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
      <div className="flex flex-wrap gap-2">
        {RANGES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRange(id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
              range === id ? "border-gold-bright bg-gold-bright text-night2" : "border-line/30 bg-surface text-ink-soft hover:border-gold-bright"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && !stats && <p className="text-sm text-ink-soft">جارٍ التحميل…</p>}

      {stats && (
        <div className={`space-y-4 transition ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="الزوار" value={Number(stats.visitors)} hint="أشخاص مختلفون" />
            <Tile label="الزيارات" value={Number(stats.visits)} hint="كل دخول للموقع" />
            <Tile label="ضغطات زر الحجز" value={sum("book_click")} hint={`من ${n(sum("book_click", undefined, "people"))} شخص`} />
            <Tile label="حجوزات أُرسلت" value={booked()} hint="من نموذج الحجز" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line/25 bg-surface">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line/20 text-xs text-ink-soft">
                  <th className="p-3 text-start">الفرع</th>
                  <th className="p-3">حددوا الفرع</th>
                  <th className="p-3">ضغطوا الحجز</th>
                  <th className="p-3">ضغطوا واتساب</th>
                  <th className="p-3">حجوزات أُرسلت</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b} className="border-b border-line/10 text-center last:border-0">
                    <td className="p-3 text-start font-bold">{BRANCHES[b]}</td>
                    <td className="p-3">{n(sum("branch", b, "people"))}</td>
                    <td className="p-3">
                      {n(sum("book_click", b, "people"))} <span className="text-[11px] text-ink-soft">({n(sum("book_click", b))} ضغطة)</span>
                    </td>
                    <td className="p-3">{n(sum("whatsapp", b, "people"))}</td>
                    <td className="p-3">{n(booked(b))}</td>
                  </tr>
                ))}
                <tr className="text-center text-ink-soft">
                  <td className="p-3 text-start">الصفحة الرئيسية (قبل اختيار فرع)</td>
                  <td className="p-3">—</td>
                  <td className="p-3">{n(sum("book_click", null, "people"))}</td>
                  <td className="p-3">{n(sum("whatsapp", null, "people"))}</td>
                  <td className="p-3">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-ink-soft">
            الأرقام بعدد الأشخاص المختلفين (الشخص يُحسب مرة واحدة حتى لو ضغط أكثر من مرة). العدّ بدأ من يوم تفعيل الميزة، ولا يُحفظ أي بيانات شخصية.
          </p>
        </div>
      )}
    </div>
  );
}
