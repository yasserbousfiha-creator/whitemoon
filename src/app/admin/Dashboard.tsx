"use client";

import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
import {
  BRANCHES,
  SERVICES,
  STATUSES,
  type Booking,
  type BookingStatus,
  type BranchId,
  type ServiceId,
} from "@/lib/booking-labels";
import { formatDay, formatTime } from "@/lib/slots";
import { refreshDashboard, signOut, updateBooking } from "./actions";
import type { DashboardData } from "./data";
import SchedulePanel from "./SchedulePanel";
import SpinsPanel from "./SpinsPanel";

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-gold-bright text-night2",
  contacted: "bg-sky-100 text-sky-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-600",
};

const createdFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Riyadh",
});

const todayRiyadh = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Saudi mobiles are typed as 05…, 5… or +966…; wa.me needs the international digits only.
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`;
  return digits.replace(/^00/, "");
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-gold-bright bg-gold-bright font-bold text-night2" : "border-line/30 bg-surface hover:border-gold-bright"
      }`}
    >
      {children}
    </button>
  );
}

function BookingCard({ booking, reload }: { booking: Booking; reload: () => Promise<void> }) {
  const [current, applyOptimistic] = useOptimistic(
    { status: booking.status, notes: booking.notes },
    (state, patch: { status?: BookingStatus; notes?: string }) => ({ ...state, ...patch }),
  );
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function save(patch: { status?: BookingStatus; notes?: string }) {
    setMessage(null);
    startTransition(async () => {
      applyOptimistic(patch);
      const result = await updateBooking(booking.id, patch);
      // Pull fresh data before the transition ends, so the optimistic value hands over without flicking back.
      if (result.ok) await reload();
      setMessage(result.ok ? { ok: true, text: "تم الحفظ ✓" } : { ok: false, text: result.error });
    });
  }

  const b = booking;
  return (
    <article className={`rounded-2xl border border-line/25 bg-surface p-4 transition ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{b.name}</h2>
          <p className="text-sm text-ink-soft">
            {SERVICES[b.service]} · {BRANCHES[b.branch]}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[current.status]}`}>
          {STATUSES[current.status]}
        </span>
      </div>

      <p className="mt-3 rounded-xl bg-surface2 px-3 py-2 text-sm">
        <span className="font-bold">الموعد المطلوب: </span>
        {b.appointment_date && b.appointment_time
          ? `${formatDay(b.appointment_date, "ar")} · ${formatTime(b.appointment_time.slice(0, 5), "ar")}`
          : "لم يُحدد"}
        {b.doctor ? (
          <>
            <br />
            <span className="font-bold">الطبيب: </span>
            {b.doctor}
          </>
        ) : null}
      </p>

      <p className="mt-2 text-xs text-ink-soft">
        أُرسل {createdFormat.format(new Date(b.created_at))} · {b.source === "app" ? "من التطبيق" : "من الموقع"} · #{b.id}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <a href={`tel:${b.phone}`} dir="ltr" className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright">
          {b.phone}
        </a>
        <a
          href={`https://wa.me/${whatsappNumber(b.phone)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright"
        >
          واتساب
        </a>
        <a
          href={`mailto:${b.email}`}
          dir="ltr"
          className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright"
        >
          {b.email}
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(STATUSES) as BookingStatus[])
          .filter((s) => s !== current.status)
          .map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => save({ status: s })}
              className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium hover:bg-gold-bright/40 disabled:opacity-50"
            >
              ← {STATUSES[s]}
            </button>
          ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save({ notes });
        }}
      >
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظة للمراجع (تظهر له في التطبيق)"
          maxLength={1000}
          className="min-w-0 flex-1 rounded-[10px] border border-line/30 bg-bg px-3 py-1.5 text-sm outline-none focus:border-gold-bright"
        />
        <button
          type="submit"
          disabled={pending || notes === (current.notes ?? "")}
          className="rounded-full border border-line/40 px-3 py-1.5 text-sm hover:border-gold-bright disabled:opacity-50"
        >
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
      </form>

      <p aria-live="polite" className={`mt-2 min-h-5 text-xs ${message?.ok === false ? "text-red-600" : "text-emerald-700"}`}>
        {pending ? "جارٍ الحفظ…" : message?.text}
      </p>
    </article>
  );
}

// Filters run in the browser over the bookings the server already sent, so switching them is instant.
const REFRESH_SECONDS = 20;

const lastUpdatedFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { timeStyle: "medium", timeZone: "Asia/Riyadh" });

export default function Dashboard({
  staff,
  initial,
}: {
  staff: { name: string; branch: BranchId | null };
  initial: DashboardData;
}) {
  // Kept up to date by polling a server action (every 20 s, and on returning to the tab), plus right after each change.
  const [data, setData] = useState(initial);
  const { bookings, spins, blocks } = data;
  const reload = useCallback(async () => {
    const fresh = await refreshDashboard().catch(() => null);
    if (fresh) setData(fresh);
  }, []);
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && reload();
    const id = setInterval(tick, REFRESH_SECONDS * 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [reload]);

  const [tab, setTab] = useState<"bookings" | "spins" | "schedule">("bookings");
  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [service, setService] = useState<ServiceId | null>(null);
  const [todayOnly, setTodayOnly] = useState(false);

  const today = todayRiyadh();
  const shown = bookings.filter(
    (b) =>
      (!status || b.status === status) &&
      (!branch || b.branch === branch) &&
      (!service || b.service === service) &&
      (!todayOnly || b.appointment_date === today),
  );
  const newCount = bookings.filter((b) => b.status === "new").length;

  return (
    <main className="min-h-screen bg-bg pb-16">
      <header className="sticky top-0 z-10 border-b border-line/25 bg-surface2/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="font-display text-xl">لوحة الحجوزات</h1>
            <p className="text-xs text-ink-soft">
              {staff.name} · {staff.branch ? BRANCHES[staff.branch] : "كل الفروع"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {newCount ? (
              <span className="rounded-full bg-gold-bright px-3 py-1 text-sm font-bold text-night2">{newCount} جديد</span>
            ) : null}
            <form action={signOut}>
              <button className="rounded-full border border-line/40 px-4 py-1.5 text-sm hover:border-gold-bright">خروج</button>
            </form>
          </div>
        </div>
      </header>
      <p className="mx-auto max-w-5xl px-4 pt-2 text-xs text-ink-soft">
        آخر تحديث: {lastUpdatedFormat.format(new Date(data.loadedAt))} · يتحدث تلقائياً كل {REFRESH_SECONDS} ثانية
      </p>
      {data.bookingsError && (
        <p className="bg-red-50 p-3 text-center text-sm text-red-700">تعذّر تحميل الحجوزات ({data.bookingsError}).</p>
      )}
      {data.spinsError && (
        <p className="bg-red-50 p-3 text-center text-sm text-red-700">تعذّر تحميل جوائز العجلة ({data.spinsError}).</p>
      )}

      <nav className="mx-auto flex max-w-5xl gap-6 border-b border-line/20 px-4 pt-3">
        {(
          [
            ["bookings", "الحجوزات"],
            ["spins", "جوائز العجلة"],
            ["schedule", "جدول الأطباء"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 pb-2 text-sm font-bold ${tab === id ? "border-gold-bright text-ink" : "border-transparent text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "schedule" ? (
        <SchedulePanel blocks={blocks} bookings={bookings} reload={reload} />
      ) : tab === "spins" ? (
        <SpinsPanel spins={spins} reload={reload} />
      ) : (
        <>
          <div className="mx-auto max-w-5xl space-y-3 px-4 pt-5">
            <div className="flex flex-wrap gap-2">
              <Chip active={!status} onClick={() => setStatus(null)}>
                الكل
              </Chip>
              {(Object.keys(STATUSES) as BookingStatus[]).map((s) => (
                <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                  {STATUSES[s]}
                </Chip>
              ))}
              <Chip active={todayOnly} onClick={() => setTodayOnly(!todayOnly)}>
                مواعيد اليوم
              </Chip>
            </div>
            <div className="flex flex-wrap gap-2">
              {!staff.branch &&
                (Object.keys(BRANCHES) as BranchId[]).map((id) => (
                  <Chip key={id} active={branch === id} onClick={() => setBranch(branch === id ? null : id)}>
                    {BRANCHES[id]}
                  </Chip>
                ))}
              {(Object.keys(SERVICES) as ServiceId[]).map((id) => (
                <Chip key={id} active={service === id} onClick={() => setService(service === id ? null : id)}>
                  {SERVICES[id]}
                </Chip>
              ))}
            </div>
          </div>

          <section className="mx-auto mt-5 grid max-w-5xl gap-3 px-4 md:grid-cols-2">
            {shown.length === 0 && <p className="text-ink-soft">لا توجد حجوزات.</p>}
            {shown.map((b) => (
              <BookingCard key={b.id} booking={b} reload={reload} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
