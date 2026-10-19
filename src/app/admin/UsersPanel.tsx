"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { BRANCHES, type BranchId } from "@/lib/booking-labels";
import { ADMIN_TABS, type AdminTab, TAB_LABELS, defaultTabs } from "@/lib/staff-access";
import { type StaffUser, createStaffUser, listStaffUsers, resetStaffPassword, updateStaffUser } from "./user-actions";

const field = "mt-1 w-full rounded-lg border border-line/40 bg-bg px-3 py-2 text-sm outline-none focus:border-gold-bright";

/** The two call-center accounts (user's choice): every branch, bookings and the doctors' schedule. */
const CALL_CENTER = [
  { username: "callcenter1", name: "الكول سنتر 1" },
  { username: "callcenter2", name: "الكول سنتر 2" },
];
const CALL_CENTER_TABS: AdminTab[] = ["bookings", "schedule"];
const CALL_CENTER_PASSWORD = "123456";

const signInFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });

function TabPicker({ value, onChange }: { value: AdminTab[]; onChange: (v: AdminTab[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ADMIN_TABS.map((t) => {
        const on = value.includes(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${on ? "border-gold-bright bg-gold-bright/20 text-ink" : "border-line/30 text-ink-soft"}`}
          >
            {on ? "✓ " : ""}
            {TAB_LABELS[t]}
          </button>
        );
      })}
    </div>
  );
}

function BranchSelect({ id, value, onChange }: { id: string; value: BranchId | null; onChange: (v: BranchId | null) => void }) {
  return (
    <select id={id} value={value ?? ""} onChange={(e) => onChange((e.target.value || null) as BranchId | null)} className={field}>
      <option value="">كل الفروع</option>
      {(Object.keys(BRANCHES) as BranchId[]).map((b) => (
        <option key={b} value={b}>
          {BRANCHES[b]}
        </option>
      ))}
    </select>
  );
}

function UserCard({ user, reload }: { user: StaffUser; reload: () => void }) {
  const [tabs, setTabs] = useState<AdminTab[]>(user.tabs ?? defaultTabs(user.branch));
  const [branch, setBranch] = useState<BranchId | null>(user.branch);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const changed = branch !== user.branch || tabs.join() !== (user.tabs ?? defaultTabs(user.branch)).join();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, okText: string) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error });
      if (r.ok) reload();
    });

  return (
    <div className="space-y-3 rounded-2xl border border-line/25 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold">
            {user.name}{" "}
            {user.isAdmin && <span className="ms-1 rounded-full bg-gold-bright px-2 py-0.5 text-xs text-night2">مدير الموقع</span>}
          </p>
          <p className="text-xs text-ink-soft">
            <span dir="ltr">{user.username}</span> · {user.branch ? BRANCHES[user.branch] : "كل الفروع"} ·{" "}
            {user.lastSignIn ? `آخر دخول ${signInFormat.format(new Date(user.lastSignIn))}` : "لم يدخل بعد"}
          </p>
        </div>
      </div>

      {user.isAdmin ? (
        <p className="text-xs text-ink-soft">مدير الموقع يفتح كل الأقسام ويدير المستخدمين.</p>
      ) : (
        <>
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-soft">الأقسام المسموحة</p>
            <TabPicker value={tabs} onChange={setTabs} />
          </div>
          <label className="block max-w-xs text-xs font-bold text-ink-soft">
            الفرع
            <BranchSelect id={`branch-${user.userId}`} value={branch} onChange={setBranch} />
          </label>
          <button
            type="button"
            disabled={pending || !changed}
            onClick={() => run(() => updateStaffUser(user.userId, { branch, tabs }), "تم حفظ الصلاحيات.")}
            className="rounded-full bg-gold-bright px-5 py-1.5 text-sm font-bold text-night2 disabled:opacity-40"
          >
            حفظ الصلاحيات
          </button>
        </>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-line/15 pt-3">
        <label className="block min-w-0 flex-1 text-xs font-bold text-ink-soft">
          كلمة مرور جديدة لهذا الحساب
          <input id={`pw-${user.userId}`} type="text" dir="ltr" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="6 أحرف على الأقل" />
        </label>
        <button
          type="button"
          disabled={pending || password.length < 6}
          onClick={() => run(async () => {
            const r = await resetStaffPassword(user.userId, password);
            if (r.ok) setPassword("");
            return r;
          }, "تم تعيين كلمة المرور الجديدة.")}
          className="rounded-full border border-line/40 px-4 py-2 text-sm disabled:opacity-40"
        >
          تعيين
        </button>
      </div>
      {msg && <p className={`rounded-xl p-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}

function NewUserForm({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState<BranchId | null>(null);
  const [tabs, setTabs] = useState<AdminTab[]>(["bookings", "schedule"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await createStaffUser({ username, name, password, branch, tabs });
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
      className="space-y-3 rounded-2xl border border-gold-bright/50 bg-surface p-4"
    >
      <p className="font-bold">مستخدم جديد</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-bold text-ink-soft">
          اسم المستخدم (للدخول)
          <input id="new-username" dir="ltr" required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className={field} placeholder="reception2" />
        </label>
        <label className="block text-xs font-bold text-ink-soft">
          الاسم الظاهر
          <input id="new-name" required value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="استقبال الوسام" />
        </label>
        <label className="block text-xs font-bold text-ink-soft">
          كلمة المرور
          <input id="new-password" type="text" dir="ltr" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
      </div>
      <label className="block max-w-xs text-xs font-bold text-ink-soft">
        الفرع
        <BranchSelect id="new-branch" value={branch} onChange={setBranch} />
      </label>
      <div>
        <p className="mb-1.5 text-xs font-bold text-ink-soft">الأقسام المسموحة</p>
        <TabPicker value={tabs} onChange={setTabs} />
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="rounded-full bg-gold-bright px-5 py-2 text-sm font-bold text-night2 disabled:opacity-50">
        {pending ? "جارٍ الإنشاء…" : "إنشاء الحساب"}
      </button>
    </form>
  );
}

/** المستخدمون (the site admin only): every /admin account, what it may open, and its password. */
export default function UsersPanel() {
  const [users, setUsers] = useState<StaffUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const [ccMsg, setCcMsg] = useState<string | null>(null);

  const reload = useCallback(() => {
    listStaffUsers().then((r) => (r.ok ? (setUsers(r.users), setError(null)) : setError(r.error)));
  }, []);
  useEffect(reload, [reload]);

  const missingCc = users ? CALL_CENTER.filter((c) => !users.some((u) => u.username === c.username)) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">حسابات لوحة التحكم، وما يفتحه كل حساب منها.</p>
        <button type="button" onClick={() => setAdding((v) => !v)} className="rounded-full bg-gold-bright px-5 py-2 text-sm font-bold text-night2">
          {adding ? "إغلاق" : "+ مستخدم جديد"}
        </button>
      </div>

      {missingCc.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-bright/50 bg-surface2 p-4 text-sm">
          <p>
            حسابا الكول سنتر غير موجودين بعد: <b dir="ltr">{missingCc.map((c) => c.username).join(", ")}</b> — كل الفروع، الحجوزات وجدول الأطباء، وكلمة المرور{" "}
            <b dir="ltr">{CALL_CENTER_PASSWORD}</b>.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setCcMsg(null);
                for (const c of missingCc) {
                  const r = await createStaffUser({ ...c, password: CALL_CENTER_PASSWORD, branch: null, tabs: CALL_CENTER_TABS });
                  if (!r.ok) return setCcMsg(r.error);
                }
                reload();
              })
            }
            className="rounded-full bg-gold-bright px-5 py-2 font-bold text-night2 disabled:opacity-50"
          >
            {pending ? "جارٍ الإنشاء…" : "إنشاء الحسابين"}
          </button>
          {ccMsg && <p className="w-full rounded-xl bg-red-50 p-2.5 text-red-700">{ccMsg}</p>}
        </div>
      )}

      {adding && (
        <NewUserForm
          onDone={() => {
            setAdding(false);
            reload();
          }}
        />
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!users && !error && <p className="text-ink-soft">جارٍ التحميل…</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {users?.map((u) => <UserCard key={`${u.userId}-${u.tabs?.join() ?? "d"}-${u.branch ?? "all"}`} user={u} reload={reload} />)}
      </div>
    </div>
  );
}
