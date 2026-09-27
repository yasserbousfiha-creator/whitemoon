"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/lib/locale-context";
import { bookableDays, formatDay, formatTime, timeSlots } from "@/lib/slots";

const noop = () => () => {};

// Day and time chips. Slots depend on the current time, so they render only in the browser (the page is prerendered).
export default function SlotPicker({
  date,
  time,
  onDate,
  onTime,
}: {
  date: string | null;
  time: string | null;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
}) {
  const { t, locale } = useLocale();
  const b = t.booking;
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return <div className="min-h-24 md:col-span-2" />;

  const days = bookableDays();
  const slots = date ? timeSlots(date) : [];
  const chip = (active: boolean) =>
    `shrink-0 rounded-xl border px-3 py-2 text-[13.5px] transition ${
      active ? "border-gold-bright bg-gold-bright font-bold text-night2" : "border-line/30 bg-bg hover:border-gold-bright"
    }`;

  return (
    <>
      <div className="md:col-span-2">
        <p className="text-[13px] font-bold text-ink-soft">{b.date}</p>
        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button key={d} type="button" onClick={() => onDate(d)} className={chip(d === date)}>
              <span className="block text-[11.5px] opacity-80">{formatDay(d, locale, { day: undefined, month: undefined })}</span>
              <span className="block">{formatDay(d, locale, { weekday: undefined })}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="md:col-span-2">
        <p className="text-[13px] font-bold text-ink-soft">{b.time}</p>
        {date ? (
          <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => (
              <button key={s} type="button" onClick={() => onTime(s)} className={chip(s === time)}>
                {formatTime(s, locale)}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-[13px] text-ink-soft">{b.pickDateFirst}</p>
        )}
      </div>
    </>
  );
}
