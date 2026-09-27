import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BRANCHES,
  SERVICES,
  STATUSES,
  type Booking,
  type BookingStatus,
  type BranchId,
  type ServiceId,
} from "@/lib/booking-labels";
import { createStaffClient, supabaseConfigured } from "@/lib/supabase";
import { signOut, updateBooking } from "./actions";
import AutoRefresh from "./AutoRefresh";

export const metadata: Metadata = { title: "لوحة الحجوزات | وايت مون", robots: { index: false } };

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-gold-bright text-night2",
  contacted: "bg-sky-100 text-sky-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-600",
};

const dateFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Riyadh",
});

// Saudi mobiles are typed as 05…, 5… or +966…; wa.me needs the international digits only.
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("5")) return `966${digits}`;
  return digits.replace(/^00/, "");
}

type Filters = { status?: BookingStatus; branch?: BranchId; service?: ServiceId };

function filterHref(current: Filters, change: Partial<Record<keyof Filters, string | undefined>>) {
  const params = new URLSearchParams();
  const next = { ...current, ...change };
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-gold-bright bg-gold-bright font-bold text-night2" : "border-line/30 bg-surface hover:border-gold-bright"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // Reading searchParams first keeps this page rendered per request, never prerendered.
  const sp = await searchParams;
  if (!supabaseConfigured) {
    return <p className="p-8 text-center">لم يتم ربط قاعدة البيانات بعد (متغيرات Supabase غير مضبوطة).</p>;
  }

  const supabase = await createStaffClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/admin/login");

  const { data: staff } = await supabase.from("staff").select("name, branch").eq("user_id", userId).maybeSingle();
  if (!staff) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-8 text-center">
        <p>هذا الحساب غير مسجّل كموظف. اطلب من الإدارة إضافته.</p>
        <form action={signOut}>
          <button className="rounded-full border border-line/40 px-5 py-2">تسجيل الخروج</button>
        </form>
      </main>
    );
  }

  const filters: Filters = {
    status: sp.status && sp.status in STATUSES ? (sp.status as BookingStatus) : undefined,
    branch: !staff.branch && sp.branch && sp.branch in BRANCHES ? (sp.branch as BranchId) : undefined,
    service: sp.service && sp.service in SERVICES ? (sp.service as ServiceId) : undefined,
  };

  // Row level security already limits a branch account to its own branch.
  let query = supabase
    .from("bookings")
    .select("id, created_at, name, phone, email, service, branch, source, status, notes")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.branch) query = query.eq("branch", filters.branch);
  if (filters.service) query = query.eq("service", filters.service);

  const [{ data: bookings, error }, { count: newCount }] = await Promise.all([
    query.returns<Booking[]>(),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <main className="min-h-screen bg-bg pb-16">
      <AutoRefresh />
      <header className="sticky top-0 z-10 border-b border-line/25 bg-surface2/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="font-display text-xl">لوحة الحجوزات</h1>
            <p className="text-xs text-ink-soft">
              {staff.name} · {staff.branch ? BRANCHES[staff.branch as BranchId] : "كل الفروع"}
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

      <div className="mx-auto max-w-5xl space-y-3 px-4 pt-5">
        <div className="flex flex-wrap gap-2">
          <Chip href={filterHref(filters, { status: undefined })} active={!filters.status}>
            الكل
          </Chip>
          {(Object.keys(STATUSES) as BookingStatus[]).map((s) => (
            <Chip key={s} href={filterHref(filters, { status: s })} active={filters.status === s}>
              {STATUSES[s]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {!staff.branch &&
            (Object.keys(BRANCHES) as BranchId[]).map((b) => (
              <Chip key={b} href={filterHref(filters, { branch: filters.branch === b ? undefined : b })} active={filters.branch === b}>
                {BRANCHES[b]}
              </Chip>
            ))}
          {(Object.keys(SERVICES) as ServiceId[]).map((s) => (
            <Chip key={s} href={filterHref(filters, { service: filters.service === s ? undefined : s })} active={filters.service === s}>
              {SERVICES[s]}
            </Chip>
          ))}
        </div>
      </div>

      <section className="mx-auto mt-5 grid max-w-5xl gap-3 px-4 md:grid-cols-2">
        {error && <p className="text-red-600">تعذّر تحميل الحجوزات.</p>}
        {bookings?.length === 0 && <p className="text-ink-soft">لا توجد حجوزات.</p>}
        {bookings?.map((b) => (
          <article key={b.id} className="rounded-2xl border border-line/25 bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{b.name}</h2>
                <p className="text-sm text-ink-soft">
                  {SERVICES[b.service]} · {BRANCHES[b.branch]}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[b.status]}`}>{STATUSES[b.status]}</span>
            </div>

            <p className="mt-2 text-xs text-ink-soft">
              {dateFormat.format(new Date(b.created_at))} · {b.source === "app" ? "من التطبيق" : "من الموقع"} · #{b.id}
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
              <a href={`mailto:${b.email}`} dir="ltr" className="rounded-full border border-line/30 px-3 py-1.5 hover:border-gold-bright">
                {b.email}
              </a>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Object.keys(STATUSES) as BookingStatus[])
                .filter((s) => s !== b.status)
                .map((s) => (
                  <form key={s} action={updateBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium hover:bg-gold-bright/40">
                      ← {STATUSES[s]}
                    </button>
                  </form>
                ))}
            </div>

            <form action={updateBooking} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={b.id} />
              <input
                name="notes"
                defaultValue={b.notes ?? ""}
                placeholder="ملاحظة (موعد مقترح، سبب الإلغاء…)"
                maxLength={1000}
                className="min-w-0 flex-1 rounded-[10px] border border-line/30 bg-bg px-3 py-1.5 text-sm outline-none focus:border-gold-bright"
              />
              <button className="rounded-full border border-line/40 px-3 py-1.5 text-sm hover:border-gold-bright">حفظ</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
