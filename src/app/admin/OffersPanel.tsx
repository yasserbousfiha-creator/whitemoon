"use client";

import { useState, useTransition } from "react";
import { BRANCHES, SERVICES, type BranchId, type ServiceId } from "@/lib/booking-labels";
import { type Offer, isLive, offerIn, riyadhToday } from "@/lib/offers";
import { uploadDoctorPhoto } from "./doctor-actions";
import { type OfferInput, deleteOffer, moveOffer, saveOffer, setOfferActive } from "./offer-actions";
import { uploadPhoto } from "./shrink";

const fieldClass = "mt-1 w-full rounded-lg border border-line/40 bg-bg px-3 py-2 text-sm outline-none focus:border-gold-bright";

const toInput = (o: Offer): OfferInput => ({
  id: o.id,
  titleAr: o.titleAr,
  titleEn: o.titleEn,
  descriptionAr: o.descriptionAr,
  descriptionEn: o.descriptionEn,
  image: o.image,
  priceBefore: o.priceBefore === null ? "" : String(o.priceBefore),
  priceAfter: o.priceAfter === null ? "" : String(o.priceAfter),
  branches: o.branches,
  service: o.service,
  endsOn: o.endsOn ?? "",
  active: o.active,
});

const blank = (branch: BranchId): OfferInput => ({
  id: null,
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  image: null,
  priceBefore: "",
  priceAfter: "",
  branches: [branch],
  service: "dentistry",
  endsOn: "",
  active: true,
});

const dateFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeZone: "UTC" });
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));
const sar = (n: number) => `${n.toLocaleString("en-US")} ر.س`;

// Management adds, edits, hides, reorders and removes offers. They appear on the site (the "Offers" section, and a
// popup on branch pages) within a few seconds; expired ones disappear by themselves.
export default function OffersPanel({
  offers,
  error,
  branch,
  reload,
}: {
  offers: Offer[];
  error: string | null;
  branch: BranchId;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<OfferInput | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [onlyBranch, setOnlyBranch] = useState(true);
  const today = riyadhToday();

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

  if (editing) {
    return (
      <OfferEditor
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

  const shown = onlyBranch ? offers.filter((o) => offerIn(o, branch)) : offers;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          العروض الظاهرة في الموقع الآن: {offers.filter((o) => isLive(o, today)).length}. التعديلات تظهر خلال ثوانٍ، والعرض
          المنتهي يختفي تلقائياً بعد آخر يوم له.
        </p>
        <button
          type="button"
          onClick={() => setEditing(blank(branch))}
          className="rounded-full bg-gold-bright px-5 py-2 text-sm font-bold text-night2"
        >
          + إضافة عرض
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyBranch} onChange={(e) => setOnlyBranch(e.target.checked)} />
        عروض {BRANCHES[branch]} فقط
      </label>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error === "42P01" || error === "PGRST205"
            ? "جدول العروض غير موجود بعد: شغّل ملف supabase/011_offers.sql في Supabase."
            : `تعذّر تحميل العروض (${error}).`}
        </p>
      )}
      {message && (
        <p className={`rounded-xl p-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}
      {!error && shown.length === 0 && <p className="text-ink-soft">لا توجد عروض بعد.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((o) => {
          const expired = !!o.endsOn && o.endsOn < today;
          const i = offers.indexOf(o);
          return (
            <article
              key={o.id}
              className={`flex gap-3 rounded-2xl border border-line/25 bg-surface p-3 ${isLive(o, today) ? "" : "opacity-60"}`}
            >
              {o.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                <img src={o.image} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-surface2 text-xs text-ink-soft">
                  بدون صورة
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-bold">
                  {o.titleAr}
                  {!o.active && <Badge className="bg-stone-200 text-stone-700">مخفي</Badge>}
                  {expired && <Badge className="bg-red-100 text-red-800">منتهي</Badge>}
                </p>
                <p className="text-xs text-ink-soft">
                  {SERVICES[o.service]} · {o.branches.length === 0 ? "كل الفروع" : o.branches.map((b) => BRANCHES[b]).join("، ")}
                </p>
                {(o.priceAfter !== null || o.priceBefore !== null) && (
                  <p className="text-sm">
                    {o.priceBefore !== null && <s className="me-2 text-ink-soft">{sar(o.priceBefore)}</s>}
                    {o.priceAfter !== null && <b className="text-gold">{sar(o.priceAfter)}</b>}
                  </p>
                )}
                <p className="text-xs text-ink-soft">{o.endsOn ? `ينتهي: ${formatDate(o.endsOn)}` : "بدون تاريخ انتهاء"}</p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-sm">
                  <button
                    type="button"
                    disabled={pending || i === 0}
                    onClick={() => run(() => moveOffer(o.id, -1), "تم تغيير الترتيب.")}
                    className="rounded-full border border-line/30 px-2.5 py-0.5 disabled:opacity-30"
                    aria-label="تقديم"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={pending || i === offers.length - 1}
                    onClick={() => run(() => moveOffer(o.id, 1), "تم تغيير الترتيب.")}
                    className="rounded-full border border-line/30 px-2.5 py-0.5 disabled:opacity-30"
                    aria-label="تأخير"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setEditing(toInput(o))}
                    className="rounded-full border border-gold-bright/60 px-3 py-0.5 font-bold text-gold"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => setOfferActive(o.id, !o.active),
                        o.active ? "تم إخفاء العرض من الموقع." : "العرض ظاهر في الموقع الآن.",
                      )
                    }
                    className="rounded-full border border-line/30 px-3 py-0.5"
                  >
                    {o.active ? "إخفاء" : "إظهار"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`حذف العرض «${o.titleAr}» نهائياً؟\nالحجوزات التي تمت منه تبقى باسم العرض.`)) {
                        run(() => deleteOffer(o.id), "تم حذف العرض.");
                      }
                    }}
                    className="rounded-full border border-red-300 px-3 py-0.5 text-red-700"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`ms-2 rounded-full px-2 py-0.5 text-xs font-normal ${className}`}>{children}</span>;
}

function OfferEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: OfferInput;
  onCancel: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [o, setO] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof OfferInput>(key: K, value: OfferInput[K]) => setO((prev) => ({ ...prev, [key]: value }));

  async function onImage(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const r = await uploadPhoto(uploadDoctorPhoto, file, "offers", 1400);
      if (r.ok) set("image", r.url);
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
      const r = await saveOffer(o);
      if (!r.ok) setError(r.error);
      else await onSaved(o.id ? "تم حفظ العرض." : "تمت إضافة العرض.");
    });
  }

  const toggleBranch = (id: BranchId) =>
    set("branches", o.branches.includes(id) ? o.branches.filter((b) => b !== id) : [...o.branches, id]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
      <h2 className="font-display text-xl">{o.id ? `تعديل: ${initial.titleAr}` : "إضافة عرض جديد"}</h2>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line/25 bg-surface p-4">
        {o.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of the uploaded design
          <img src={o.image} alt="" className="h-32 w-32 rounded-xl object-cover" />
        ) : (
          <span className="grid h-32 w-32 place-items-center rounded-xl bg-surface2 text-xs text-ink-soft">بدون صورة</span>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <label className="inline-block cursor-pointer rounded-full border border-gold-bright/60 px-4 py-1.5 font-bold text-gold">
              {uploading ? "جارٍ الرفع…" : o.image ? "تغيير التصميم" : "رفع تصميم العرض"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  onImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {o.image && (
              <button type="button" onClick={() => set("image", null)} className="rounded-full border border-line/30 px-4 py-1.5">
                إزالة
              </button>
            )}
          </div>
          <p className="text-xs text-ink-soft">صورة العرض كما تُنشر في السوشيال ميديا (مربعة أو طولية). اختيارية.</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-line/25 bg-surface p-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink-soft">
          عنوان العرض بالعربي
          <input
            value={o.titleAr}
            placeholder="مثال: تنظيف وتلميع الأسنان"
            onChange={(e) => set("titleAr", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          العنوان بالإنجليزي (اختياري)
          <input
            dir="ltr"
            value={o.titleEn}
            placeholder="e.g. Teeth cleaning & polishing"
            onChange={(e) => set("titleEn", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft sm:col-span-2">
          الوصف بالعربي (اختياري)
          <textarea rows={3} value={o.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} className={fieldClass} />
        </label>
        <label className="text-sm font-bold text-ink-soft sm:col-span-2">
          الوصف بالإنجليزي (اختياري)
          <textarea
            dir="ltr"
            rows={3}
            value={o.descriptionEn}
            onChange={(e) => set("descriptionEn", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          السعر قبل العرض (ر.س، اختياري)
          <input
            inputMode="decimal"
            value={o.priceBefore}
            onChange={(e) => set("priceBefore", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          السعر بعد العرض (ر.س، اختياري)
          <input
            inputMode="decimal"
            value={o.priceAfter}
            onChange={(e) => set("priceAfter", e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-bold text-ink-soft">
          القسم (يُختار تلقائياً عند الحجز)
          <select value={o.service} onChange={(e) => set("service", e.target.value)} className={fieldClass}>
            {(Object.keys(SERVICES) as ServiceId[]).map((id) => (
              <option key={id} value={id}>
                {SERVICES[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink-soft">
          آخر يوم للعرض (فارغ = مستمر)
          <input type="date" value={o.endsOn} onChange={(e) => set("endsOn", e.target.value)} className={fieldClass} />
        </label>
        <div className="text-sm font-bold text-ink-soft sm:col-span-2">
          الفروع
          <div className="mt-1.5 flex flex-wrap gap-3 font-normal">
            {(Object.keys(BRANCHES) as BranchId[]).map((id) => (
              <label key={id} className="flex items-center gap-1.5">
                <input type="checkbox" checked={o.branches.includes(id)} onChange={() => toggleBranch(id)} />
                {BRANCHES[id]}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs font-normal">بدون اختيار = العرض في كل الفروع.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-ink-soft sm:col-span-2">
          <input type="checkbox" checked={o.active} onChange={(e) => set("active", e.target.checked)} />
          ظاهر في الموقع
        </label>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={save}
          disabled={pending || uploading}
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
