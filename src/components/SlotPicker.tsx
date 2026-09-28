"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Availability } from "@/app/api/availability/route";
import { DOCTORS, type DoctorId, groupByShift, isBlocked } from "@/lib/doctors";
import { useLocale } from "@/lib/locale-context";
import { bookableDays, formatDay, formatTime, timeSlots } from "@/lib/slots";

const noop = () => () => {};

// Day and time chips. Slots depend on the current time, so they render only in the browser (the page is prerendered).
// With a doctor chosen, only their shifts show, and slots the admin closed or that are already booked are red.
export default function SlotPicker({
  date,
  time,
  onDate,
  onTime,
  doctorId = null,
  refreshKey = 0,
}: {
  date: string | null;
  time: string | null;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
  doctorId?: DoctorId | null;
  refreshKey?: number; // bump to re-fetch availability (e.g. after a slot was taken meanwhile)
}) {
  const { t, locale } = useLocale();
  const b = t.booking;
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [availability, setAvailability] = useState<{ doctor: DoctorId; data: Availability } | null>(null);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    fetch(`/api/availability?doctor=${doctorId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Availability | null) => {
        if (!cancelled && data) setAvailability({ doctor: doctorId, data });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [doctorId, refreshKey]);

  if (!mounted) return <div className="min-h-24 md:col-span-2" />;

  const avail = doctorId && availability?.doctor === doctorId ? availability.data : null;
  const unavailable = (d: string, s: string) =>
    !!doctorId && !!avail && (isBlocked(avail.blocks, doctorId, d, s) || avail.taken.includes(`${d} ${s}`));
  const days = bookableDays(new Date(), doctorId);
  const dayFull = (d: string) => !!doctorId && timeSlots(d, new Date(), doctorId).every((s) => unavailable(d, s));
  const slots = date ? timeSlots(date, new Date(), doctorId) : [];
  // Two-shift doctors get their slots split into morning and evening; everyone else one plain group.
  const splitDoctor = !!doctorId && DOCTORS[doctorId].shifts.length > 1;
  const groups = doctorId ? groupByShift(doctorId, slots) : slots.length ? [slots] : [];

  const chip = (active: boolean, off: boolean) =>
    `shrink-0 rounded-xl border px-3 py-2 text-[13.5px] transition ${
      off
        ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400 line-through"
        : active
          ? "border-gold-bright bg-gold-bright font-bold text-night2"
          : "border-line/30 bg-bg hover:border-gold-bright"
    }`;

  return (
    <>
      <div className="min-w-0 md:col-span-2">
        <p className="text-[13px] font-bold text-ink-soft">{b.date}</p>
        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const off = dayFull(d);
            return (
              <button key={d} type="button" disabled={off} onClick={() => onDate(d)} className={chip(d === date, off)}>
                <span className="block text-[11.5px] opacity-80">
                  {formatDay(d, locale, { day: undefined, month: undefined })}
                </span>
                <span className="block">{formatDay(d, locale, { weekday: undefined })}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        <p className="text-[13px] font-bold text-ink-soft">{b.time}</p>
        {date ? (
          <>
            {groups.map((group) => (
              <div key={group[0]}>
                {/* A heading per shift for doctors with a morning and an evening shift. */}
                {groups.length > 1 || splitDoctor ? (
                  <p className="mt-3 mb-1.5 flex items-center gap-2 text-[12.5px] font-bold text-gold">
                    {Number(group[0].slice(0, 2)) < 12 ? b.morning : b.evening}
                    <span className="h-px flex-1 bg-line/30" />
                  </p>
                ) : null}
                <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {group.map((s) => {
                    const off = unavailable(date, s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={off}
                        onClick={() => onTime(s)}
                        className={chip(s === time && !off, off)}
                      >
                        {formatTime(s, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {doctorId && slots.some((s) => unavailable(date, s)) && (
              <p className="mt-1.5 text-[12px] text-red-500">{b.closedHint}</p>
            )}
          </>
        ) : (
          <p className="mt-1.5 text-[13px] text-ink-soft">{b.pickDateFirst}</p>
        )}
      </div>
    </>
  );
}
