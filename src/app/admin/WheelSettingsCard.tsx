"use client";

import { useState, useTransition } from "react";
import { MAX_PRIZES, MIN_PRIZES, type Prize, type WheelSettings } from "@/lib/wheel";
import { saveWheelSettings } from "./wheel-actions";

const field = "mt-1 w-full rounded-lg border border-line/40 bg-bg px-3 py-2 text-sm outline-none focus:border-gold-bright";

const newPrize = (): Prize => ({
  id: `p${Date.now().toString(36)}`,
  ar: "",
  en: "",
  shortAr: ["", ""],
  shortEn: ["", ""],
  weight: 1,
});

// Management shows or hides the monthly wheel on the site and edits its prizes and odds. Codes already won keep
// the prize name they were won with.
export default function WheelSettingsCard({
  initial,
  error: loadError,
  reload,
  readOnly = false,
}: {
  initial: WheelSettings;
  error: string | null;
  reload: () => Promise<void>;
  /** View only: whether it shows, and the prizes — no switch, no editing. */
  readOnly?: boolean;
}) {
  const [settings, setSettings] = useState(initial);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const total = settings.prizes.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);

  const setPrize = (i: number, change: Partial<Prize>) =>
    setSettings((s) => ({ ...s, prizes: s.prizes.map((p, j) => (j === i ? { ...p, ...change } : p)) }));

  function save(next: WheelSettings, done: string) {
    setMessage(null);
    startTransition(async () => {
      const r = await saveWheelSettings(next);
      if (!r.ok) setMessage({ ok: false, text: r.error });
      else {
        setSettings(next);
        setMessage({ ok: true, text: done });
        await reload();
      }
    });
  }

  if (loadError === "missing") {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        إخفاء العجلة وتعديل جوائزها يحتاج تشغيل ملف supabase/012_wheel_settings.sql في Supabase.
      </p>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line/25 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="font-bold">عجلة الحظ الشهرية</p>
          <p className={`text-sm ${initial.enabled ? "text-emerald-700" : "text-ink-soft"}`}>
            {initial.enabled ? "ظاهرة في الموقع ويمكن للزوار المحاولة." : "مخفية من الموقع، ولا تُقبل محاولات جديدة."}
          </p>
        </div>
        {!readOnly && (
        <>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            save(
              { ...initial, enabled: !initial.enabled },
              initial.enabled ? "تم إخفاء العجلة من الموقع." : "العجلة ظاهرة في الموقع الآن.",
            )
          }
          className={`rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
            initial.enabled ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {initial.enabled ? "إخفاء العجلة" : "إظهار العجلة"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSettings(initial);
            setOpen(!open);
          }}
          className="rounded-full border border-gold-bright/60 px-4 py-2 text-sm font-bold text-gold"
        >
          {open ? "إغلاق" : "تعديل الجوائز"}
        </button>
        </>
        )}
      </div>
      {readOnly && (
        <ul className="flex flex-wrap gap-2 text-sm">
          {initial.prizes.map((p) => (
            <li key={p.id} className="rounded-full border border-line/30 px-3 py-1">
              {p.ar}
            </li>
          ))}
        </ul>
      )}

      {loadError && loadError !== "missing" && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">تعذّر تحميل إعدادات العجلة ({loadError}).</p>
      )}
      {message && (
        <p className={`rounded-xl p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      {open && (
        <div className="space-y-3">
          <p className="text-xs text-ink-soft">
            نسبة الفوز رقم نسبي: جائزة بالرقم 2 تظهر ضعف جائزة بالرقم 1. الرموز التي رُبحت سابقاً تبقى باسم جائزتها كما
            كان.
          </p>
          {settings.prizes.map((p, i) => (
            <div key={p.id} className="grid gap-3 rounded-xl border border-line/20 bg-bg p-3 sm:grid-cols-2">
              <div className="flex items-center justify-between sm:col-span-2">
                <p className="font-bold text-gold">الجائزة {i + 1}</p>
                <button
                  type="button"
                  disabled={settings.prizes.length <= MIN_PRIZES}
                  onClick={() => setSettings((s) => ({ ...s, prizes: s.prizes.filter((_, j) => j !== i) }))}
                  className="text-sm text-red-700 disabled:opacity-30"
                >
                  حذف
                </button>
              </div>
              <label className="text-sm font-bold text-ink-soft">
                اسم الجائزة بالعربي
                <input
                  value={p.ar}
                  placeholder="مثال: خصم 20% على التبييض"
                  onChange={(e) => setPrize(i, { ar: e.target.value })}
                  className={field}
                />
              </label>
              <label className="text-sm font-bold text-ink-soft">
                اسم الجائزة بالإنجليزي
                <input dir="ltr" value={p.en} onChange={(e) => setPrize(i, { en: e.target.value })} className={field} />
              </label>
              <label className="text-sm font-bold text-ink-soft">
                المكتوب على العجلة بالعربي (سطران قصيران)
                <span className="flex gap-2">
                  <input
                    value={p.shortAr[0]}
                    maxLength={14}
                    placeholder="خصم 20%"
                    onChange={(e) => setPrize(i, { shortAr: [e.target.value, p.shortAr[1]] })}
                    className={field}
                  />
                  <input
                    value={p.shortAr[1]}
                    maxLength={14}
                    placeholder="التبييض"
                    onChange={(e) => setPrize(i, { shortAr: [p.shortAr[0], e.target.value] })}
                    className={field}
                  />
                </span>
              </label>
              <label className="text-sm font-bold text-ink-soft">
                المكتوب على العجلة بالإنجليزي
                <span className="flex gap-2">
                  <input
                    dir="ltr"
                    value={p.shortEn[0]}
                    maxLength={14}
                    placeholder="20% OFF"
                    onChange={(e) => setPrize(i, { shortEn: [e.target.value, p.shortEn[1]] })}
                    className={field}
                  />
                  <input
                    dir="ltr"
                    value={p.shortEn[1]}
                    maxLength={14}
                    placeholder="Whitening"
                    onChange={(e) => setPrize(i, { shortEn: [p.shortEn[0], e.target.value] })}
                    className={field}
                  />
                </span>
              </label>
              <label className="text-sm font-bold text-ink-soft">
                نسبة الفوز
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={p.weight}
                  onChange={(e) => setPrize(i, { weight: Number(e.target.value) })}
                  className={field}
                />
              </label>
              <p className="self-end pb-2 text-sm text-ink-soft">
                فرصة الفوز تقريباً: {total > 0 ? Math.round(((Number(p.weight) || 0) / total) * 100) : 0}%
              </p>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={settings.prizes.length >= MAX_PRIZES}
              onClick={() => setSettings((s) => ({ ...s, prizes: [...s.prizes, newPrize()] }))}
              className="rounded-full border border-line/40 px-4 py-2 text-sm disabled:opacity-40"
            >
              + إضافة جائزة
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => save({ ...settings, enabled: initial.enabled }, "تم حفظ جوائز العجلة.")}
              className="rounded-full bg-gold-bright px-6 py-2 text-sm font-bold text-night2 disabled:opacity-60"
            >
              {pending ? "جارٍ الحفظ…" : "حفظ الجوائز"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
