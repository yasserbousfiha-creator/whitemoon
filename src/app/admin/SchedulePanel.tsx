"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { BranchId } from "@/lib/booking-labels";
import { type BlockTarget, type Doctor, type ScheduleBlock, doctorSlots, groupByShift, isBlocked } from "@/lib/doctors";
import { DAYS_AHEAD, addDays, formatDay, formatTime, riyadhToday } from "@/lib/slots";
import { setScheduleBlock } from "./actions";
import type { ScheduleBooking } from "./data";

// One doctor (by id), or the whole branch (closing a day for every doctor there).
type Target = string;
const isWholeBranch = (t: Target) => t.startsWith("all-");
type BlockKey = Pick<ScheduleBlock, "doctor" | "date" | "start">;
type Change = { block: BlockKey; closed: boolean };

const same = (a: BlockKey, b: BlockKey) => a.doctor === b.doctor && a.date === b.date && a.start === b.start;

// Reception opens a doctor and a day to see every slot: green = open, red = closed by the admin, grey = booked.
// Tapping an open or closed slot toggles it; the day can be closed or reopened in one go.
export default function SchedulePanel({
  branch,
  doctors,
  blocks,
  bookings,
  reload,
  readOnly = false,
}: {
  branch: BranchId;
  doctors: Doctor[]; // visible ones
  blocks: BlockKey[];
  bookings: ScheduleBooking[];
  reload: () => Promise<void>;
  /** View only: the schedule and what's closed, without opening or closing anything. */
  readOnly?: boolean;
}) {
  const branchDoctors = doctors.filter((d) => d.branch === branch);
  const wholeBranch: Target = `all-${branch}`;
  const [picked, setTarget] = useState<Target>(branchDoctors[0]?.id ?? wholeBranch);
  // Switching branch in the dashboard (or hiding the doctor) falls back to that branch's first doctor.
  const doctor = isWholeBranch(picked) ? null : (branchDoctors.find((d) => d.id === picked) ?? branchDoctors[0] ?? null);
  const target: Target = doctor?.id ?? wholeBranch;
  // Blocks that close this target's whole day besides its own: everyone, and (for a doctor) their branch.
  const widerTargets: BlockTarget[] = doctor ? ["all", wholeBranch] : ["all"];
  const [date, setDate] = useState(() => riyadhToday());
  const [current, applyChange] = useOptimistic(blocks, (state, c: Change) =>
    c.closed ? [...state.filter((b) => !same(b, c.block)), c.block] : state.filter((b) => !same(b, c.block)),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(block: BlockKey, closed: boolean) {
    setError(null);
    startTransition(async () => {
      applyChange({ block, closed });
      const r = await setScheduleBlock(block.doctor, block.date, block.start, closed);
      if (!r.ok) setError(r.error);
      else await reload();
    });
  }

  const today = riyadhToday();
  const days = Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(today, i)).filter(
    (d) => !doctor || doctorSlots(doctor, d).length > 0,
  );
  const dayClosed = (d: string) =>
    current.some((b) => b.date === d && b.start === null && (b.doctor === target || widerTargets.includes(b.doctor)));
  const ownDayBlock = current.some((b) => b.doctor === target && b.date === date && b.start === null);
  const closedByAll = current.some((b) => widerTargets.includes(b.doctor) && b.date === date && b.start === null);
  const bookedAt = (time: string) =>
    bookings.find(
      (b) =>
        b.doctor_id === target &&
        b.appointment_date === date &&
        b.appointment_time?.slice(0, 5) === time &&
        b.status !== "cancelled",
    );

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition ${
      active
        ? "border-gold-bright bg-gold-bright font-bold text-night2"
        : "border-line/30 bg-surface hover:border-gold-bright"
    }`;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pt-5">
      <div className="flex flex-wrap gap-2">
        {branchDoctors.map((d) => (
          <button key={d.id} type="button" className={chip(target === d.id)} onClick={() => setTarget(d.id)}>
            {d.nameAr}
          </button>
        ))}
        <button type="button" className={chip(target === wholeBranch)} onClick={() => setTarget(wholeBranch)}>
          كل أطباء الفرع (إغلاق يوم كامل)
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDate(d)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-sm ${
              d === date
                ? "border-gold-bright bg-gold-bright font-bold text-night2"
                : dayClosed(d)
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-line/30 bg-surface"
            }`}
          >
            <span className="block text-xs opacity-80">{formatDay(d, "ar", { day: undefined, month: undefined })}</span>
            <span className="block">{formatDay(d, "ar", { weekday: undefined })}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line/25 bg-surface p-4">
        <p className="flex-1 font-bold">
          {formatDay(date, "ar", { year: "numeric" })}
          {closedByAll && <span className="ms-2 text-sm font-normal text-red-700">(مغلق لكل الأطباء)</span>}
        </p>
        {!readOnly && (
        <button
          type="button"
          disabled={pending || closedByAll}
          onClick={() => toggle({ doctor: target, date, start: null }, !ownDayBlock)}
          className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${
            ownDayBlock ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {ownDayBlock ? "فتح اليوم" : !doctor ? "إغلاق اليوم لكل أطباء الفرع" : "إغلاق اليوم بالكامل"}
        </button>
        )}
      </div>

      {doctor && (
        <>
          <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" /> {readOnly ? "متاح" : "متاح (اضغط للإغلاق)"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-500" /> {readOnly ? "مغلق" : "مغلق (اضغط للفتح)"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-stone-400" /> محجوز
            </span>
          </div>
          {doctorSlots(doctor, date).length === 0 && <p className="text-ink-soft">لا دوام للطبيب في هذا اليوم.</p>}
          {groupByShift(doctor, doctorSlots(doctor, date), date).map((group, gi, groups) => (
            <div key={group[0]} className="space-y-2">
              {groups.length > 1 && (
                <p className="flex items-center gap-2 text-sm font-bold text-gold">
                  {Number(group[0].slice(0, 2)) < 12 ? "الفترة الصباحية" : "الفترة المسائية"}
                  <span className="h-px flex-1 bg-line/30" />
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {group.map((time) => {
                  const booked = bookedAt(time);
                  const closed = isBlocked(current, doctor, date, time);
                  const slotBlock = current.some((b) => same(b, { doctor: target, date, start: time }));
                  if (booked) {
                    return (
                      <div
                        key={time}
                        className="rounded-xl bg-stone-200 px-2 py-2 text-center text-sm text-stone-600"
                        title={booked.name}
                      >
                        <span className="block font-bold">{formatTime(time, "ar")}</span>
                        <span className="block truncate text-xs">{booked.name}</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={time}
                      type="button"
                      // A slot closed by the whole-day block reopens with "فتح اليوم", not individually.
                      disabled={pending || readOnly || (closed && !slotBlock)}
                      onClick={() => toggle({ doctor: target, date, start: time }, !closed)}
                      className={`rounded-xl px-2 py-2.5 text-center text-sm font-bold text-white transition ${readOnly ? "disabled:cursor-default" : "disabled:opacity-60"} ${
                        closed ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                      }`}
                    >
                      {formatTime(time, "ar")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
