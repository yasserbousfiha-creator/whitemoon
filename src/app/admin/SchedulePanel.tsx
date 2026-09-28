"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { Booking } from "@/lib/booking-labels";
import { DOCTOR_IDS, DOCTORS, type DoctorId, type ScheduleBlock, doctorSlots, isBlocked } from "@/lib/doctors";
import { DAYS_AHEAD, addDays, formatDay, formatTime, riyadhToday } from "@/lib/slots";
import { setScheduleBlock } from "./actions";

type Target = DoctorId | "all";
type BlockKey = Pick<ScheduleBlock, "doctor" | "date" | "start">;
type Change = { block: BlockKey; closed: boolean };

const same = (a: BlockKey, b: BlockKey) => a.doctor === b.doctor && a.date === b.date && a.start === b.start;

// Reception opens a doctor and a day to see every slot: green = open, red = closed by the admin, grey = booked.
// Tapping an open or closed slot toggles it; the day can be closed or reopened in one go.
export default function SchedulePanel({ blocks, bookings }: { blocks: BlockKey[]; bookings: Booking[] }) {
  const [target, setTarget] = useState<Target>("yasmine");
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
    });
  }

  const today = riyadhToday();
  const days = Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(today, i)).filter(
    (d) => target === "all" || doctorSlots(target, d).length > 0,
  );
  const dayClosed = (d: string) =>
    current.some((b) => b.date === d && b.start === null && (b.doctor === target || b.doctor === "all"));
  const ownDayBlock = current.some((b) => b.doctor === target && b.date === date && b.start === null);
  const closedByAll = target !== "all" && current.some((b) => b.doctor === "all" && b.date === date && b.start === null);
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
      active ? "border-gold-bright bg-gold-bright font-bold text-night2" : "border-line/30 bg-surface hover:border-gold-bright"
    }`;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pt-5">
      <div className="flex flex-wrap gap-2">
        {DOCTOR_IDS.map((id) => (
          <button key={id} type="button" className={chip(target === id)} onClick={() => setTarget(id)}>
            {DOCTORS[id].names[0]}
          </button>
        ))}
        <button type="button" className={chip(target === "all")} onClick={() => setTarget("all")}>
          كل الأطباء (إغلاق يوم كامل)
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
        <button
          type="button"
          disabled={pending || closedByAll}
          onClick={() => toggle({ doctor: target, date, start: null }, !ownDayBlock)}
          className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${
            ownDayBlock ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {ownDayBlock ? "فتح اليوم" : target === "all" ? "إغلاق اليوم لكل الأطباء" : "إغلاق اليوم بالكامل"}
        </button>
      </div>

      {target !== "all" && (
        <>
          <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" /> متاح (اضغط للإغلاق)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-500" /> مغلق (اضغط للفتح)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-stone-400" /> محجوز
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
            {doctorSlots(target, date).map((time) => {
              const booked = bookedAt(time);
              const closed = isBlocked(current, target, date, time);
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
                  disabled={pending || (closed && !slotBlock)}
                  onClick={() => toggle({ doctor: target, date, start: time }, !closed)}
                  className={`rounded-xl px-2 py-2.5 text-center text-sm font-bold text-white transition disabled:opacity-60 ${
                    closed ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  {formatTime(time, "ar")}
                </button>
              );
            })}
            {doctorSlots(target, date).length === 0 && (
              <p className="col-span-full text-ink-soft">لا دوام للطبيب في هذا اليوم.</p>
            )}
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
