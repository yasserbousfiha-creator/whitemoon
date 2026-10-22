"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { BRANCHES, type BranchId } from "@/lib/booking-labels";
import {
  ADMIN_TABS,
  type Access,
  EDIT_MEANS,
  MIN_PASSWORD,
  type Permissions,
  TAB_LABELS,
  defaultPermissions,
  randomPassword,
} from "@/lib/staff-access";
import { type StaffUser, createStaffUser, listStaffUsers, resetStaffPassword, updateStaffUser } from "./user-actions";

const field = "mt-1 w-full rounded-lg border border-line/40 bg-bg px-3 py-2 text-sm outline-none focus:border-gold-bright";

/** The call-center accounts (user's choice): bookings and the doctors' schedule; 1 and 2 see every branch, 3 and 4 one each. */
const CALL_CENTER: { username: string; name: string; branch: BranchId | null }[] = [
  { username: "callcenter1", name: "الكول سنتر 1", branch: null },
  { username: "callcenter2", name: "الكول سنتر 2", branch: null },
  { username: "callcenter3", name: "الكول سنتر 3 (شهار)", branch: "shahar" },
  { username: "callcenter4", name: "الكول سنتر 4 (الوسام)", branch: "wisam" },
];
// …and sees the doctors and the live offers to answer patients, without changing them.
const CALL_CENTER_PERMISSIONS: Permissions = { ...defaultPermissions("khamseen"), spins: "none", bookings: "edit", schedule: "edit", doctors: "view", offers: "view" };

const signInFormat = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });

const LEVELS: [Access, string][] = [
  ["none", "مخفي"],
  ["view", "عرض فقط"],
  ["edit", "عرض وتعديل"],
];

/** Each section: hidden, view only, or view and edit. */
function PermissionsEditor({ value, onChange }: { value: Permissions; onChange: (v: Permissions) => void }) {
  return (
    <div className="divide-y divide-line/15 rounded-xl border border-line/20">
      {ADMIN_TABS.map((t) => (
        <div key={t} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-bold">{TAB_LABELS[t]}</p>
            <p className="text-[11px] text-ink-soft">التعديل: {EDIT_MEANS[t]}</p>
          </div>
          <div className="flex overflow-hidden rounded-full border border-line/30 text-xs font-bold" role="radiogroup" aria-label={TAB_LABELS[t]}>
            {LEVELS.map(([level, label]) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={value[t] === level}
                onClick={() => onChange({ ...value, [t]: level })}
                className={`px-3 py-1 ${value[t] === level ? (level === "none" ? "bg-stone-300 text-stone-800" : level === "view" ? "bg-sky-200 text-sky-900" : "bg-gold-bright text-night2") : "text-ink-soft"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
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
  const [permissions, setPermissions] = useState<Permissions>(user.permissions);
  const [branch, setBranch] = useState<BranchId | null>(user.branch);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const changed = branch !== user.branch || JSON.stringify(permissions) !== JSON.stringify(user.permissions);

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
            <p className="mb-1.5 text-xs font-bold text-ink-soft">الصلاحيات</p>
            <PermissionsEditor value={permissions} onChange={setPermissions} />
          </div>
          <label className="block max-w-xs text-xs font-bold text-ink-soft">
            الفرع
            <BranchSelect id={`branch-${user.userId}`} value={branch} onChange={setBranch} />
          </label>
          <button
            type="button"
            disabled={pending || !changed}
            onClick={() => run(() => updateStaffUser(user.userId, { branch, permissions }), "تم حفظ الصلاحيات.")}
            className="rounded-full bg-gold-bright px-5 py-1.5 text-sm font-bold text-night2 disabled:opacity-40"
          >
            حفظ الصلاحيات
          </button>
        </>
      )}

      <div className="flex flex-wrap items-end gap-2 border-t border-line/15 pt-3">
        <label className="block min-w-0 flex-1 text-xs font-bold text-ink-soft">
          كلمة مرور جديدة لهذا الحساب
          <input id={`pw-${user.userId}`} type="text" dir="ltr" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder={`${MIN_PASSWORD} أحرف على الأقل`} />
        </label>
        <button
          type="button"
          disabled={pending || password.length < MIN_PASSWORD}
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
  const [permissions, setPermissions] = useState<Permissions>(CALL_CENTER_PERMISSIONS);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await createStaffUser({ username, name, password, branch, permissions });
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
          <input id="new-password" type="text" dir="ltr" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
      </div>
      <label className="block max-w-xs text-xs font-bold text-ink-soft">
        الفرع
        <BranchSelect id="new-branch" value={branch} onChange={setBranch} />
      </label>
      <div>
        <p className="mb-1.5 text-xs font-bold text-ink-soft">الصلاحيات</p>
        <PermissionsEditor value={permissions} onChange={setPermissions} />
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
  const [created, setCreated] = useState<{ username: string; password: string }[]>([]);

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
            حسابات الكول سنتر غير موجودة بعد:{" "}
            {missingCc.map((c, i) => (
              <span key={c.username}>
                {i > 0 && "، "}
                <b dir="ltr">{c.username}</b> ({c.branch ? BRANCHES[c.branch] : "كل الفروع"})
              </span>
            ))}{" "}
            — الحجوزات وجدول الأطباء، ولكل حساب كلمة مرور عشوائية تظهر هنا مرة واحدة بعد الإنشاء.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setCcMsg(null);
                const made: { username: string; password: string }[] = [];
                for (const c of missingCc) {
                  const password = randomPassword();
                  const r = await createStaffUser({ ...c, password, permissions: CALL_CENTER_PERMISSIONS });
                  if (!r.ok) {
                    setCcMsg(r.error);
                    break;
                  }
                  made.push({ username: c.username, password });
                }
                setCreated((prev) => [...prev, ...made]);
                reload();
              })
            }
            className="rounded-full bg-gold-bright px-5 py-2 font-bold text-night2 disabled:opacity-50"
          >
            {pending ? "جارٍ الإنشاء…" : missingCc.length === 1 ? "إنشاء الحساب" : `إنشاء الحسابات (${missingCc.length})`}
          </button>
          {ccMsg && <p className="w-full rounded-xl bg-red-50 p-2.5 text-red-700">{ccMsg}</p>}
        </div>
      )}

      {created.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-gold-bright/50 bg-surface2 p-4 text-sm">
          <p className="font-bold">انسخ كلمات المرور الآن وسلّم كل موظف كلمته — لن تظهر مرة أخرى:</p>
          <ul dir="ltr" className="space-y-1 text-left font-mono">
            {created.map((c) => (
              <li key={c.username}>
                {c.username}: <b className="select-all">{c.password}</b>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setCreated([])} className="rounded-full border border-line/40 px-4 py-1.5">
            تم النسخ، إخفاء
          </button>
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
        {users?.map((u) => <UserCard key={`${u.userId}-${JSON.stringify(u.permissions)}-${u.branch ?? "all"}`} user={u} reload={reload} />)}
      </div>
    </div>
  );
}
