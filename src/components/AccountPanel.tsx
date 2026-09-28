"use client";

import { useEffect } from "react";
import { CalendarCheck, LogOut, UserRound, X } from "lucide-react";
import { type AccountBooking, refreshStatuses, signOut, splitBookings, useAccount } from "@/lib/account";
import { useLocale } from "@/lib/locale-context";
import { formatDay, formatTime } from "@/lib/slots";

const STATUS_STYLE: Record<NonNullable<AccountBooking["status"]>, string> = {
  new: "bg-surface2 text-gold",
  contacted: "bg-sky-100 text-sky-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-stone-200 text-stone-600",
};

function BookingRow({ b, muted }: { b: AccountBooking; muted?: boolean }) {
  const { t, locale } = useLocale();
  const a = t.account;
  return (
    <div className={`flex gap-3 border-t border-line/15 pt-3 first:border-t-0 first:pt-0 ${muted ? "opacity-70" : ""}`}>
      <CalendarCheck size={18} className="mt-0.5 shrink-0 text-gold" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[14.5px] font-bold text-ink">{t.services.find((s) => s.icon === b.service)?.title}</p>
          {b.status && (
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[b.status]}`}>
              {a.statuses[b.status]}
            </span>
          )}
        </div>
        <p className="text-[13px] text-ink-soft">{t.branches.find((br) => br.id === b.branch)?.name}</p>
        {b.doctor && <p className="text-[13px] text-gold">{b.doctor}</p>}
        <p className="text-[13px] font-medium text-ink">
          {formatDay(b.slotDate, locale)} · {formatTime(b.slotTime, locale)}
        </p>
        {b.notes && (
          <div className="mt-1.5 rounded-lg bg-surface2 px-3 py-2">
            <p className="text-[10.5px] font-bold text-ink-soft">{a.clinicNote}</p>
            <p className="text-[13.5px] text-ink">{b.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Side panel with the visitor's saved details and appointments (see lib/account.ts).
export default function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const a = t.account;
  const account = useAccount();

  useEffect(() => {
    if (open) refreshStatuses();
  }, [open]);

  if (!open) return null;
  const { upcoming, past } = account ? splitBookings(account.bookings) : { upcoming: [], past: [] };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={a.title}>
      <button type="button" aria-label={a.close} onClick={onClose} className="absolute inset-0 bg-night/60" />
      <div className="absolute inset-y-0 end-0 flex w-[88%] max-w-md flex-col overflow-y-auto bg-bg p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface2">
            <UserRound size={24} className="text-gold" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-ink-soft">{a.title}</p>
            <p className="font-display text-[20px] text-ink">{account ? account.name : a.guestTitle}</p>
          </div>
          <button type="button" aria-label={a.close} onClick={onClose} className="text-ink">
            <X size={22} />
          </button>
        </div>

        {account ? (
          <div className="mt-6 space-y-4">
            <div className="space-y-2 rounded-2xl border border-line/25 bg-surface p-4 text-[14px]">
              <p>
                <span className="text-ink-soft">{a.name}: </span>
                <span className="font-bold text-ink">{account.name}</span>
              </p>
              <p>
                <span className="text-ink-soft">{a.phone}: </span>
                <span dir="ltr" className="font-bold text-ink">
                  {account.phone}
                </span>
              </p>
              <p>
                <span className="text-ink-soft">{a.email}: </span>
                <span dir="ltr" className="font-bold text-ink">
                  {account.email}
                </span>
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-line/25 bg-surface p-4">
              <p className="text-[11px] font-bold text-ink-soft">{a.upcoming}</p>
              {upcoming.length ? (
                upcoming.map((b) => <BookingRow key={b.token} b={b} />)
              ) : (
                <p className="text-[13.5px] text-ink-soft">{a.noUpcoming}</p>
              )}
            </div>

            {past.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-line/25 bg-surface p-4">
                <p className="text-[11px] font-bold text-ink-soft">{a.past}</p>
                {past.map((b) => (
                  <BookingRow key={b.token} b={b} muted />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line/40 px-5 py-2.5 text-[14px] font-semibold text-ink hover:bg-surface2"
            >
              <LogOut size={16} />
              {a.signOut}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-[14.5px] leading-relaxed text-ink-soft">{a.guestBody}</p>
            <a
              href="#booking"
              onClick={onClose}
              className="block rounded-full bg-gold-bright px-5 py-3 text-center text-[14px] font-semibold text-night2"
            >
              {t.ctaBookNow}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
