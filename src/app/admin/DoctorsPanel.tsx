"use client";

import { useState, useTransition } from "react";
import { BRANCHES, SERVICES, type BranchId, type ServiceId } from "@/lib/booking-labels";
import type { Doctor, Shift, WeeklyHours } from "@/lib/doctors";
import { type DoctorInput, deleteDoctor, moveDoctor, saveDoctor, uploadDoctorPhoto } from "./doctor-actions";
import { uploadPhoto } from "./shrink";

// The Saudi week, Saturday first; values are JS weekdays (0 = Sunday).
const WEEK: [number, string][] = [
  [6, "السبت"],
  [0, "الأحد"],
  [1, "الإثنين"],
  [2, "الثلاثاء"],
  [3, "الأربعاء"],
  [4, "الخميس"],
  [5, "الجمعة"],
];

// Half-hour steps from 6 AM to 11:30 PM.
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});

const label12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "ص" : "م"}`;
};

const toInput = (d: Doctor): DoctorInput => ({
  id: d.id,
  nameAr: d.nameAr,
  nameEn: d.nameEn,
  roleAr: d.roleAr,
  roleEn: d.roleEn,
  bioAr: d.bioAr,
  bioEn: d.bioEn,
  branch: d.branch,
  service: d.service,
  hours: d.hours,
  photo: d.photo,
  cases: d.cases,
  active: d.active,
});

const blank = (branch: BranchId): DoctorInput => ({
  id: null,
  nameAr: "د. ",
  nameEn: "Dr. ",
  roleAr: "",
  roleEn: "",
  bioAr: "",
  bioEn: "",
  branch,
  service: "dentistry",
  // Saturday to Thursday, 1:30–9:30 PM: the usual hours, edited from there.
  hours: Object.fromEntries([6, 0, 1, 2, 3, 4].map((day) => [day, [["13:30", "21:30"]]])),
  photo: null,
  cases: [],
  active: true,
});

// "السبت – الخميس · 1:30 م – 9:30 م" when every working day has the same hours, otherwise the days only.
function hoursSummary(hours: WeeklyHours) {
  const days = WEEK.filter(([day]) => hours[day]?.length);
  if (days.length === 0) return "لا يوجد دوام";
  const shifts = days.map(([day]) => JSON.stringify(hours[day]));
  const names = days.length === 7 ? "كل الأيام" : days.map(([, name]) => name).join("، ");
  if (shifts.every((s) => s === shifts[0])) {
    return `${names} · ${hours[days[0][0]]!.map(([a, b]) => `${label12(a)} – ${label12(b)}`).join(" و ")}`;
  }
  return `${names} · أوقات مختلفة حسب اليوم`;
}

const fieldClass = "mt-1 w-full rounded-lg border border-line/40 bg-bg px-3 py-2 text-sm outline-none focus:border-gold-bright";

// Management adds, edits, hides, reorders and removes doctors. Changes reach the public site and the booking form
// within a few seconds (the site's pages are rebuilt on the next visit).
export default function DoctorsPanel({
  doctors,
  error,
  branch,
  reload,
  readOnly = false,
}: {
  doctors: Doctor[];
  error: string | null;
  branch: BranchId;
  reload: () => Promise<void>;
  /** View only: the doctors shown on the site, with their hours — nothing to add, edit, hide or delete. */
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState<DoctorInput | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) => {
    setMessage(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) setMessage({ ok: false, text: r.error });
      else {
        setMessage({ ok: true, text: done });
        await reload();
      }
    });
  };

  const branchDoctors = doctors.filter((d) => d.branch === branch && (!readOnly || d.active));
  const departments = (Object.keys(SERVICES) as ServiceId[])
    .map((s) => ({ service: s, list: branchDoctors.filter((d) => d.service === s) }))
    .filter((g) => g.list.length > 0);

  if (editing) {
    return (
      <DoctorEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={async (text) => {
          setEditing(null);
          setMessage({ ok: true, text });
          await reload();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          أطباء {BRANCHES[branch]}: {branchDoctors.length}.{readOnly ? "" : " التعديلات تظهر في الموقع ونموذج الحجز خلال ثوانٍ."}
        </p>
        {!readOnly && (
        <button
          type="button"
          onClick={() => setEditing(blank(branch))}
          className="rounded-full bg-gold-bright px-5 py-2 text-sm font-bold text-night2"
        >
          + إضافة طبيب
        </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error === "42P01" || error === "PGRST205"
            ? "جدول الأطباء غير موجود بعد: شغّل ملف supabase/009_doctors.sql في Supabase."
            : `تعذّر تحميل الأطباء (${error}).`}
        </p>
      )}
      {message && (
        <p className={`rounded-xl p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}
      {!error && branchDoctors.length === 0 && <p className="text-ink-soft">لا يوجد أطباء في هذا الفرع بعد.</p>}

      {departments.map(({ service, list }) => (
        <section key={service} className="space-y-2">
          <h2 className="flex items-center gap-2 font-bold text-gold">
            {SERVICES[service]}
            <span className="h-px flex-1 bg-line/30" />
          </h2>
          {list.map((d, i) => (
            <article
              key={d.id}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border border-line/25 bg-surface p-3 ${d.active ? "" : "opacity-60"}`}
            >
              {d.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                <img src={d.photo} alt="" className="h-14 w-14 rounded-full object-cover object-top" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-surface2 text-xs text-ink-soft">
                  بدون صورة
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {d.nameAr}
                  {!d.active && (
                    <span className="ms-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-normal text-stone-700">
                      مخفي
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink-soft">{d.roleAr || "—"}</p>
                <p className="text-xs text-ink-soft">{hoursSummary(d.hours)}</p>
                <p className="text-xs text-ink-soft">
                  {d.cases.length ? `صور الحالات: ${d.cases.length}` : "لا توجد صور حالات بعد"}
                </p>
              </div>
              {!readOnly && (
              <div className="flex flex-wrap gap-1.5 text-sm">
                <button
                  type="button"
                  disabled={pending || i === 0}
                  onClick={() => run(() => moveDoctor(d.id, -1), "تم تغيير الترتيب.")}
                  className="rounded-full border border-line/30 px-2.5 py-1 disabled:opacity-30"
                  aria-label="تقديم"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={pending || i === list.length - 1}
                  onClick={() => run(() => moveDoctor(d.id, 1), "تم تغيير الترتيب.")}
                  className="rounded-full border border-line/30 px-2.5 py-1 disabled:opacity-30"
                  aria-label="تأخير"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditing(toInput(d))}
                  className="rounded-full border border-gold-bright/60 px-3 py-1 font-bold text-gold"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => saveDoctor({ ...toInput(d), active: !d.active }),
                      d.active ? `تم إخفاء ${d.nameAr} من الموقع.` : `${d.nameAr} ظاهر في الموقع الآن.`,
                    )
                  }
                  className="rounded-full border border-line/30 px-3 py-1"
                >
                  {d.active ? "إخفاء" : "إظهار"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`حذف ${d.nameAr} نهائياً؟\nلإيقافه مؤقتاً استخدم «إخفاء» بدلاً من الحذف.`)) {
                      run(() => deleteDoctor(d.id), `تم حذف ${d.nameAr}.`);
                    }
                  }}
                  className="rounded-full border border-red-300 px-3 py-1 text-red-700"
                >
                  حذف
                </button>
              </div>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

function DoctorEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: DoctorInput;
  onCancel: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [d, setD] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [casesBusy, setCasesBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof DoctorInput>(key: K, value: DoctorInput[K]) => setD((prev) => ({ ...prev, [key]: value }));
  const setDay = (day: number, shifts: Shift[]) => set("hours", { ...d.hours, [day]: shifts });

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const r = await uploadPhoto(uploadDoctorPhoto, file, "photo");
      if (r.ok) set("photo", r.url);
      else setError(r.error);
    } catch {
      setError("تعذّر رفع الصورة، حاول مرة أخرى.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveDoctor(d);
      if (!r.ok) setError(r.error);
      else await onSaved(d.id ? `تم حفظ بيانات ${d.nameAr}.` : `تمت إضافة ${d.nameAr}.`);
    });
  }

  // Copies the first working day's hours (in the Saudi week) to every other working day.
  const firstDay = WEEK.find(([day]) => d.hours[day]?.length);
  const copyToAll = () => {
    if (!firstDay) return;
    const shifts = d.hours[firstDay[0]]!;
    set("hours", Object.fromEntries(WEEK.filter(([day]) => d.hours[day]?.length).map(([day]) => [day, shifts])));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
      <h2 className="font-display text-xl">{d.id ? `تعديل: ${initial.nameAr}` : "إضافة طبيب جديد"}</h2>

      <div className="flex items-center gap-4 rounded-2xl border border-line/25 bg-surface p-4">
        {d.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of the uploaded photo
          <img src={d.photo} alt="" className="h-24 w-20 rounded-xl object-cover object-top" />
        ) : (
          <span className="grid h-24 w-20 place-items-center rounded-xl bg-surface2 text-xs text-ink-soft">بدون صورة</span>
        )}
        <div className="space-y-2 text-sm">
          <label className="inline-block cursor-pointer rounded-full border border-gold-bright/60 px-4 py-1.5 font-bold text-gold">
            {uploading ? "جارٍ الرفع…" : d.photo ? "تغيير الصورة" : "رفع صورة"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
          </label>
          <p className="text-xs text-ink-soft">صورة طولية (واقفة) يظهر فيها الوجه بوضوح. بدون صورة لا يظهر الطبيب في قسم «الكادر الطبي».</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-line/25 bg-surface p-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink-soft">
          الاسم بالعربي
          <input value={d.nameAr} onChange={(e) => set("nameAr", e.target.value)} className={fieldClass} />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          الاسم بالإنجليزي
          <input dir="ltr" value={d.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={fieldClass} />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          التخصص بالعربي
          <input
            value={d.roleAr}
            placeholder="مثال: أخصائي تقويم الأسنان"
            onChange={(e) => set("roleAr", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          التخصص بالإنجليزي
          <input
            dir="ltr"
            value={d.roleEn}
            placeholder="e.g. Orthodontist"
            onChange={(e) => set("roleEn", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft sm:col-span-2">
          نبذة بالعربي (تظهر في التطبيق عند الضغط على الطبيب، كل فقرة في سطر)
          <textarea
            rows={3}
            value={d.bioAr}
            onChange={(e) => set("bioAr", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft sm:col-span-2">
          نبذة بالإنجليزي
          <textarea
            dir="ltr"
            rows={3}
            value={d.bioEn}
            onChange={(e) => set("bioEn", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          الفرع
          <select value={d.branch} onChange={(e) => set("branch", e.target.value)} className={fieldClass}>
            {(Object.keys(BRANCHES) as BranchId[]).map((id) => (
              <option key={id} value={id}>
                {BRANCHES[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink-soft">
          القسم
          <select value={d.service} onChange={(e) => set("service", e.target.value)} className={fieldClass}>
            {(Object.keys(SERVICES) as ServiceId[]).map((id) => (
              <option key={id} value={id}>
                {SERVICES[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-ink-soft sm:col-span-2">
          <input type="checkbox" checked={d.active} onChange={(e) => set("active", e.target.checked)} />
          ظاهر في الموقع ومتاح للحجز
        </label>
      </div>

      <CasesEditor cases={d.cases} onChange={(update) => setD((prev) => ({ ...prev, cases: update(prev.cases) }))} onBusy={setCasesBusy} />

      <div className="space-y-3 rounded-2xl border border-line/25 bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">أيام وأوقات الدوام</p>
          <button
            type="button"
            onClick={copyToAll}
            disabled={!firstDay}
            className="rounded-full border border-line/30 px-3 py-1 text-xs disabled:opacity-40"
          >
            نسخ أوقات {firstDay?.[1] ?? "أول يوم"} لكل أيام الدوام
          </button>
        </div>
        {WEEK.map(([day, name]) => {
          const shifts = d.hours[day] ?? [];
          const works = shifts.length > 0;
          return (
            <div key={day} className="flex flex-wrap items-center gap-2 border-t border-line/15 pt-3 text-sm">
              <label className="flex w-28 items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={works}
                  onChange={(e) => setDay(day, e.target.checked ? [["13:30", "21:30"]] : [])}
                />
                {name}
              </label>
              {!works && <span className="text-ink-soft">إجازة</span>}
              {shifts.map(([start, end], i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-ink-soft">و</span>}
                  <select
                    value={start}
                    onChange={(e) => setDay(day, shifts.map((s, j) => (j === i ? [e.target.value, s[1]] : s)))}
                    className="rounded-lg border border-line/40 bg-bg px-2 py-1"
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>
                        {label12(t)}
                      </option>
                    ))}
                  </select>
                  <span>إلى</span>
                  <select
                    value={end}
                    onChange={(e) => setDay(day, shifts.map((s, j) => (j === i ? [s[0], e.target.value] : s)))}
                    className="rounded-lg border border-line/40 bg-bg px-2 py-1"
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>
                        {label12(t)}
                      </option>
                    ))}
                  </select>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setDay(day, shifts.slice(0, 1))}
                      className="px-1 text-red-600"
                      aria-label="حذف الفترة الثانية"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
              {shifts.length === 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setDay(day, [
                      ["09:30", "12:30"],
                      ["16:30", "21:30"],
                    ])
                  }
                  className="text-xs text-gold underline"
                >
                  + فترتان (صباحية ومسائية)
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={save}
          disabled={pending || uploading || casesBusy}
          className="rounded-full bg-gold-bright px-6 py-2.5 font-bold text-night2 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-line/40 px-6 py-2.5">
          إلغاء
        </button>
      </div>
    </div>
  );
}

// The doctor's before/after photos (one combined photo per case), shown on the site under "حالات" on their card in
// this order. Several can be picked at once; they are uploaded right away and saved with the doctor.
function CasesEditor({
  cases,
  onChange,
  onBusy,
}: {
  cases: string[];
  onChange: (update: (cases: string[]) => string[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    onBusy(true);
    const added: string[] = [];
    try {
      for (const [i, file] of [...files].entries()) {
        setProgress(`جارٍ رفع ${i + 1} من ${files.length}…`);
        // Viewed full screen on the site, so kept larger than the doctor's photo.
        const r = await uploadPhoto(uploadDoctorPhoto, file, "cases", 1600).catch(() => null);
        if (r?.ok) added.push(r.url);
        else setError(r?.error ?? "تعذّر رفع إحدى الصور، حاول مرة أخرى.");
      }
    } finally {
      onChange((prev) => [...prev, ...added]);
      setProgress(null);
      onBusy(false);
    }
  }

  const move = (i: number, to: number) => {
    onChange((prev) => {
      const next = [...prev];
      [next[i], next[to]] = [next[to], next[i]];
      return next;
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-line/25 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold">صور الحالات ({cases.length})</p>
          <p className="text-xs text-ink-soft">
            صورة واحدة لكل حالة (قبل وبعد في نفس الصورة). تظهر في الموقع عند الضغط على «حالات» في بطاقة الطبيب، بهذا الترتيب.
          </p>
        </div>
        <label className="inline-block cursor-pointer rounded-full border border-gold-bright/60 px-4 py-1.5 text-sm font-bold text-gold">
          {progress ?? "+ إضافة صور"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={!!progress}
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {cases.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {cases.map((src, i) => (
            <div key={src} className="overflow-hidden rounded-xl border border-line/25 bg-surface2">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img src={src} alt={`حالة ${i + 1}`} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between px-1.5 py-1 text-sm">
                {/* Right = earlier, left = later, as the photos read from the right. */}
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="px-1.5 disabled:opacity-25"
                  aria-label="تقديم"
                >
                  →
                </button>
                <span className="text-xs text-ink-soft">{i + 1}</span>
                <button
                  type="button"
                  disabled={i === cases.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="px-1.5 disabled:opacity-25"
                  aria-label="تأخير"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => confirm("حذف صورة الحالة؟ تُحذف نهائياً عند الحفظ.") && onChange((prev) => prev.filter((c) => c !== src))}
                  className="px-1.5 text-red-600"
                  aria-label="حذف"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
