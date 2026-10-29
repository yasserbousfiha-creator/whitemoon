"use client";

import Image from "next/image";
import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
import {
  ATTENDANCE,
  BRANCHES,
  SERVICES,
  STATUSES,
  type Attendance,
  type Booking,
  type BookingStatus,
  type BranchId,
  type ServiceId,
} from "@/lib/booking-labels";
import { formatDay, formatTime } from "@/lib/slots";
import { deleteBooking, refreshDashboard, signOut, updateBooking } from "./actions";
import type { DashboardData } from "./data";
import SchedulePanel from "./SchedulePanel";
import SpinsPanel from "./SpinsPanel";
import DoctorsPanel from "./DoctorsPanel";
import OffersPanel from "./OffersPanel";
import UsersPanel from "./UsersPanel";
import StatsPanel from "./StatsPanel";
import PasswordDialog from "./PasswordDialog";
import { type AdminTab, type Permissions, TAB_LABELS } from "@/lib/staff-access";

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-gold-bright text-night2",
  contacted: "bg-sky-100 text-sky-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-600",
};

const ATTENDANCE_STYLE: Record<Attendance, string> = {
  attended: "bg-emerald-600 text-white",
  no_show: "bg-red-600 text-white",
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

// One key per patient whichever way the number was typed (05…, 5…, +966…, 00966…).
function personKey(b: Booking) {
  const digits = b.phone.replace(/\D/g, "").replace(/^00/, "").replace(/^966/, "").replace(/^0/, "");
  return digits || b.name.trim();
}

// "YYYY-MM-DD HH:MM" for ordering; bookings without a time sort last.
const slotKey = (b: Booking) => (b.appointment_date ? `${b.appointment_date} ${b.appointment_time ?? ""}` : "9999");

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-gold-bright bg-gold-bright font-bold text-night2"
          : "border-line/30 bg-surface hover:border-gold-bright"
      }`}
    >
      {children}
    </button>
  );
}

type Patch = { status?: BookingStatus; notes?: string; attendance?: Attendance | null };

const when = (iso: string | null | undefined) => (iso ? createdFormat.format(new Date(iso)) : "");

// Who did it: "تم التواصل: سارة · 27 أكتوبر 10:32" and "حضر: …". Bookings changed before
// 020_booking_actors.sql only know who touched them last, so they show that instead.
// Hidden while a change is still saving (the names are for the saved state).
function Actors({ booking: b, status, attendance }: { booking: Booking; status: BookingStatus; attendance: Attendance | null }) {
  const lines: string[] = [];
  if (status === b.status) {
    if (b.status_by_name) lines.push(`${STATUSES[b.status]}: ${b.status_by_name}${b.status_at ? ` · ${when(b.status_at)}` : ""}`);
    else if (b.status !== "new" && b.updated_by_name && !b.status_by) lines.push(`آخر تعديل: ${b.updated_by_name}${b.updated_at ? ` · ${when(b.updated_at)}` : ""}`);
  }
  if (attendance && attendance === b.attendance && b.attendance_by_name) {
    lines.push(`${ATTENDANCE[attendance]}: ${b.attendance_by_name}${b.attendance_at ? ` · ${when(b.attendance_at)}` : ""}`);
  }
  if (!lines.length) return null;
  return (
    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-soft">
      {lines.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </p>
  );
}

// One appointment inside a patient's card: its details, status, attendance and note.
// readOnly (view-only permission): the details, status and note as text — no buttons.
function BookingItem({ booking, today, reload, readOnly, canDelete }: { booking: Booking; today: string; reload: () => Promise<void>; readOnly: boolean; canDelete: boolean }) {
  const [current, applyOptimistic] = useOptimistic(
    { status: booking.status, notes: booking.notes, attendance: booking.attendance ?? null },
    (state, patch: Patch) => ({ ...state, ...patch }),
  );
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function save(patch: Patch) {
    setMessage(null);
    startTransition(async () => {
      applyOptimistic(patch);
      const result = await updateBooking(booking.id, patch);
      // Pull fresh data before the transition ends, so the optimistic value hands over without flicking back.
      if (result.ok) await reload();
      setMessage(result.ok ? { ok: true, text: "تم الحفظ ✓" } : { ok: false, text: result.error });
    });
  }

  function remove() {
    if (!window.confirm(`حذف الحجز #${booking.id} نهائيًا؟ لا يمكن التراجع عن الحذف.`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteBooking(booking.id);
      if (result.ok) await reload();
      else setMessage({ ok: false, text: result.error });
    });
  }

  const b = booking;
  // Attendance can be recorded from the appointment day onwards, for bookings that weren't cancelled.
  const canAttend = !readOnly && current.status !== "cancelled" && !!b.appointment_date && b.appointment_date <= today;
  return (
    <div className={`rounded-xl bg-surface2 p-3 transition ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">
          <span className="font-bold">
            {b.appointment_date && b.appointment_time
              ? `${formatDay(b.appointment_date, "ar")} · ${formatTime(b.appointment_time.slice(0, 5), "ar")}`
              : b.appointment_date
                ? `${formatDay(b.appointment_date, "ar")} · الوقت: يُتواصل معه`
                : b.offer
                  ? "حجز عرض — يُتواصل معه لتحديد الموعد"
                  : "لم يُحدد موعد"}
          </span>
          <br />
          {SERVICES[b.service]} · {BRANCHES[b.branch]}
          {b.doctor ? ` · ${b.doctor}` : ""}
          {b.offer && (
            <>
              <br />
              <span className="mt-1 inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                عرض: {b.offer}
              </span>
            </>
          )}
        </p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[current.status]}`}>
            {STATUSES[current.status]}
          </span>
          {current.attendance && (
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ATTENDANCE_STYLE[current.attendance]}`}>
              {ATTENDANCE[current.attendance]}
            </span>
          )}
        </div>
      </div>

      <Actors booking={b} status={current.status} attendance={current.attendance} />

      {canAttend && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-ink-soft">الحضور:</span>
          {(Object.keys(ATTENDANCE) as Attendance[]).map((a) => (
            <button
              key={a}
              type="button"
              disabled={pending}
              onClick={() => save({ attendance: current.attendance === a ? null : a })}
              className={`rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-50 ${
                current.attendance === a
                  ? `${ATTENDANCE_STYLE[a]} border-transparent`
                  : "border-line/30 bg-surface hover:border-gold-bright"
              }`}
            >
              {a === "attended" ? "✓ " : "✕ "}
              {ATTENDANCE[a]}
            </button>
          ))}
        </div>
      )}

      {readOnly ? (
        current.notes && <p className="mt-2 rounded-[10px] bg-bg px-3 py-1.5 text-sm">ملاحظة: {current.notes}</p>
      ) : (
      <>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(Object.keys(STATUSES) as BookingStatus[])
          .filter((s) => s !== current.status)
          .map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => save({ status: s })}
              className="rounded-full bg-surface px-3 py-1 text-xs font-medium hover:bg-gold-bright/40 disabled:opacity-50"
            >
              ← {STATUSES[s]}
            </button>
          ))}
      </div>

      <form
        className="mt-2 flex gap-2"
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
          حفظ
        </button>
      </form>
      </>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] text-ink-soft">
          أُرسل {createdFormat.format(new Date(b.created_at))} · {b.source === "app" ? "من التطبيق" : "من الموقع"} · #
          {b.id}
        </p>
        {canDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="shrink-0 rounded-full border border-red-300 px-3 py-0.5 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            حذف نهائي
          </button>
        )}
      </div>
      <p
        aria-live="polite"
        className={`min-h-4 text-xs ${message?.ok === false ? "text-red-600" : "text-emerald-700"}`}
      >
        {pending ? "جارٍ الحفظ…" : message?.text}
      </p>
    </div>
  );
}

// A patient with all their shown bookings, so someone who booked several times appears once.
function PersonCard({ bookings, today, reload, readOnly, canDelete }: { bookings: Booking[]; today: string; reload: () => Promise<void>; readOnly: boolean; canDelete: boolean }) {
  const first = bookings[0];
  const emails = [...new Set(bookings.map((b) => b.email).filter(Boolean))];
  return (
    <article className="rounded-2xl border border-line/25 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold">{first.name}</h2>
        {bookings.length > 1 && (
          <span className="shrink-0 rounded-full bg-gold-bright/30 px-3 py-1 text-xs font-bold">
            {bookings.length} مواعيد
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <a
          href={`tel:${first.phone}`}
          dir="ltr"
          className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright"
        >
          {first.phone}
        </a>
        <a
          href={`https://wa.me/${whatsappNumber(first.phone)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright"
        >
          واتساب
        </a>
        {emails.map((email) => (
          <a
            key={email}
            href={`mailto:${email}`}
            dir="ltr"
            className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright"
          >
            {email}
          </a>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {bookings.map((b) => (
          <BookingItem key={b.id} booking={b} today={today} reload={reload} readOnly={readOnly} canDelete={canDelete} />
        ))}
      </div>
    </article>
  );
}

// Filters run in the browser over the bookings the server already sent, so switching them is instant.
const REFRESH_SECONDS = 20;

const lastUpdatedFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  timeStyle: "medium",
  timeZone: "Asia/Riyadh",
});

export default function Dashboard({
  staff,
  initial,
}: {
  /** permissions: each section hidden / view only / view and edit; isAdmin: manages the accounts. */
  staff: { name: string; branch: BranchId | null; permissions: Permissions; isAdmin: boolean };
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

  // The sections this account may open, in the order the clinic asked for ("wheel" lives inside the prizes tab).
  // "الإعدادات" gathers the doctors and, for the site admin, the accounts.
  type Tab = "bookings" | "schedule" | "offers" | "spins" | "stats" | "settings";
  type SettingsTab = "doctors" | "users";
  const can = staff.permissions;
  const settingsTabs: SettingsTab[] = [...(can.doctors !== "none" ? (["doctors"] as const) : []), ...(staff.isAdmin ? (["users"] as const) : [])];
  const tabs: Tab[] = [
    ...(["bookings", "schedule", "offers", "spins", "stats"] as const).filter((t) => can[t] !== "none"),
    ...(settingsTabs.length ? (["settings"] as const) : []),
  ];
  const TAB_NAMES: Record<Tab, string> = {
    bookings: TAB_LABELS.bookings,
    schedule: TAB_LABELS.schedule,
    offers: TAB_LABELS.offers,
    spins: "جوائز العجلة",
    stats: "الإحصائيات",
    settings: "الإعدادات",
  };
  const SETTINGS_NAMES: Record<SettingsTab, string> = { doctors: TAB_LABELS.doctors, users: "المستخدمون" };
  /** View only in this section: lists and details without any button that changes something. */
  const viewOnly = (t: AdminTab) => can[t] === "view";
  const [tab, setTab] = useState<Tab>(tabs[0] ?? "bookings");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(settingsTabs[0] ?? "doctors");
  const [passwordOpen, setPasswordOpen] = useState(false);
  // Opens on today's confirmed appointments, the list reception works from; "all" brings back every booking.
  const [view, setView] = useState<"today" | "all">("today");
  const [status, setStatus] = useState<BookingStatus | null>(null);
  // Everything is shown one branch at a time. A branch account is fixed to its branch; others switch at the top.
  const [pickedBranch, setBranch] = useState<BranchId>("khamseen");
  const branch: BranchId = staff.branch ?? pickedBranch;
  const branchBookings = bookings.filter((b) => b.branch === branch);
  const [service, setService] = useState<ServiceId | null>(null);
  // Offer bookings are kept apart from the doctors' (user's choice 2026-10-29): no day/time, the clinic calls them.
  const [kind, setKind] = useState<"all" | "doctors" | "offers">("all");

  const today = todayRiyadh();
  const shown = bookings.filter(
    (b) =>
      (view === "today" ? b.status === "confirmed" && b.appointment_date === today : !status || b.status === status) &&
      b.branch === branch &&
      (!service || b.service === service) &&
      (kind === "all" || (kind === "offers") === !!b.offer),
  );
  const offerCount = branchBookings.filter((b) => b.offer && b.status === "new").length;

  // Group by patient. Today: by appointment time. All: most recently booked first (the server's order).
  const groups = new Map<string, Booking[]>();
  for (const b of view === "today" ? [...shown].sort((x, y) => slotKey(x).localeCompare(slotKey(y))) : shown) {
    const key = personKey(b);
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  if (view === "all") {
    // Within one patient, list their appointments in date order.
    for (const list of groups.values()) list.sort((x, y) => slotKey(x).localeCompare(slotKey(y)));
  }

  const attended = shown.filter((b) => b.attendance === "attended").length;
  const noShow = shown.filter((b) => b.attendance === "no_show").length;
  const newCount = branchBookings.filter((b) => b.status === "new").length;

  return (
    <main className="min-h-screen bg-bg pb-16">
      <header className="sticky top-0 z-10 border-b border-line/25 bg-surface2/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="relative h-11 w-11 shrink-0">
              <Image src="/images/logo.png" alt="وايت مون" fill sizes="44px" className="object-contain" priority />
            </span>
            <div>
              <h1 className="font-display text-xl">لوحة الحجوزات</h1>
              <p className="text-xs text-ink-soft">
                {staff.name} · {BRANCHES[branch]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {newCount && tabs.includes("bookings") ? (
              <button
                type="button"
                onClick={() => {
                  setTab("bookings");
                  setView("all");
                  setStatus("new");
                }}
                className="rounded-full bg-gold-bright px-3 py-1 text-sm font-bold text-night2"
              >
                {newCount} جديد
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className="rounded-full border border-line/40 px-4 py-1.5 text-sm hover:border-gold-bright"
            >
              كلمة المرور
            </button>
            <form action={signOut}>
              <button className="rounded-full border border-line/40 px-4 py-1.5 text-sm hover:border-gold-bright">
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>
      {/* The sections as a column on the right (user's choice), the work beside it; a scrolling row on phones. */}
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row md:items-start md:gap-2 md:px-4">
        <aside className="md:sticky md:top-[76px] md:w-52 md:shrink-0 md:pt-5">
          <nav className="flex gap-2 overflow-x-auto border-b border-line/20 px-4 py-3 md:flex-col md:overflow-visible md:rounded-2xl md:border md:border-line/25 md:bg-surface md:p-2">
            {tabs.map((id) => [id, TAB_NAMES[id]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-start text-sm font-bold transition ${
                  tab === id ? "bg-gold-bright text-night2" : "text-ink-soft hover:bg-surface2 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
      {!staff.branch && (
        <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pt-3">
          {(Object.keys(BRANCHES) as BranchId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setBranch(id)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                branch === id
                  ? "border-gold-bright bg-gold-bright text-night2"
                  : "border-line/30 bg-surface text-ink-soft hover:border-gold-bright"
              }`}
            >
              {BRANCHES[id]}
              <span className="ms-2 rounded-full bg-black/10 px-2 text-xs">
                {bookings.filter((b) => b.branch === id && b.status === "new").length || ""}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mx-auto max-w-5xl px-4 pt-2 text-xs text-ink-soft">
        آخر تحديث: {lastUpdatedFormat.format(new Date(data.loadedAt))} · يتحدث تلقائياً كل {REFRESH_SECONDS} ثانية
      </p>
      {data.bookingsError && (
        <p className="bg-red-50 p-3 text-center text-sm text-red-700">تعذّر تحميل الحجوزات ({data.bookingsError}).</p>
      )}
      {data.spinsError && (
        <p className="bg-red-50 p-3 text-center text-sm text-red-700">تعذّر تحميل جوائز العجلة ({data.spinsError}).</p>
      )}


      {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
      {tabs.length === 0 ? (
        <p className="mx-auto max-w-5xl px-4 pt-8 text-center text-sm text-ink-soft">لا توجد أقسام مفعّلة لحسابك — تواصل مع مدير الموقع.</p>
      ) : tab === "settings" ? (
        <>
          <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pt-5">
            {settingsTabs.map((id) => (
              <Chip key={id} active={settingsTab === id} onClick={() => setSettingsTab(id)}>
                {SETTINGS_NAMES[id]}
              </Chip>
            ))}
          </div>
          {settingsTab === "users" ? (
            <UsersPanel />
          ) : (
            <DoctorsPanel doctors={data.doctors} error={data.doctorsError} branch={branch} reload={reload} readOnly={viewOnly("doctors")} />
          )}
        </>
      ) : tab === "stats" ? (
        <StatsPanel branch={staff.branch} />
      ) : tab === "offers" ? (
        <OffersPanel offers={data.offers} error={data.offersError} branch={branch} reload={reload} readOnly={viewOnly("offers")} />
      ) : tab === "schedule" ? (
        <SchedulePanel
          branch={branch}
          doctors={data.doctors.filter((d) => d.active)}
          blocks={blocks}
          bookings={data.scheduleBookings.filter((b) => b.branch === branch)}
          reload={reload}
          readOnly={viewOnly("schedule")}
        />
      ) : tab === "spins" ? (
        <SpinsPanel
          spins={spins}
          reload={reload}
          wheel={can.wheel !== "none" ? { settings: data.wheel, error: data.wheelError, readOnly: viewOnly("wheel") } : null}
          readOnly={viewOnly("spins")}
        />
      ) : (
        <>
          <div className="mx-auto max-w-5xl space-y-3 px-4 pt-5">
            <div className="flex flex-wrap gap-2">
              <Chip active={view === "today"} onClick={() => setView("today")}>
                مواعيد اليوم المؤكدة
              </Chip>
              <Chip
                active={view === "all"}
                onClick={() => {
                  setView("all");
                  setStatus(null);
                }}
              >
                كل الحجوزات
              </Chip>
            </div>
            {view === "all" && (
              <div className="flex flex-wrap gap-2">
                <Chip active={kind === "all"} onClick={() => setKind("all")}>
                  الكل
                </Chip>
                <Chip active={kind === "doctors"} onClick={() => setKind("doctors")}>
                  حجوزات الأطباء
                </Chip>
                <Chip active={kind === "offers"} onClick={() => setKind("offers")}>
                  حجوزات العروض{offerCount ? ` (${offerCount} جديد)` : ""}
                </Chip>
              </div>
            )}
            {view === "all" && (
              <div className="flex flex-wrap gap-2">
                <Chip active={!status} onClick={() => setStatus(null)}>
                  كل الحالات
                </Chip>
                {(Object.keys(STATUSES) as BookingStatus[]).map((s) => (
                  <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                    {STATUSES[s]}
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SERVICES) as ServiceId[]).map((id) => (
                <Chip key={id} active={service === id} onClick={() => setService(service === id ? null : id)}>
                  {SERVICES[id]}
                </Chip>
              ))}
            </div>
            {view === "today" && shown.length > 0 && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-surface2 px-3 py-1">{shown.length} موعد اليوم</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">حضر: {attended}</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-900">لم يحضر: {noShow}</span>
                <span className="rounded-full bg-gold-bright/30 px-3 py-1">
                  بانتظار: {shown.length - attended - noShow}
                </span>
              </div>
            )}
          </div>

          <section className="mx-auto mt-5 grid max-w-5xl items-start gap-3 px-4 md:grid-cols-2">
            {groups.size === 0 && (
              <p className="text-ink-soft">{view === "today" ? "لا توجد مواعيد مؤكدة اليوم." : "لا توجد حجوزات."}</p>
            )}
            {[...groups].map(([key, list]) => (
              <PersonCard key={key} bookings={list} today={today} reload={reload} readOnly={viewOnly("bookings")} canDelete={staff.isAdmin} />
            ))}
          </section>
        </>
      )}
        </div>
      </div>
    </main>
  );
}
