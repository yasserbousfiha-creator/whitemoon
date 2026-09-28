"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserRound, X } from "lucide-react";
import { type AccountBooking, recordBooking, useAccount } from "@/lib/account";
import { PREFILL_EVENT, type BookingPrefill } from "@/lib/booking-prefill";
import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import SlotPicker from "./SlotPicker";

type Status = "idle" | "sending" | "success" | "error" | "invalid";

const fieldClass =
  "mt-1.5 w-full rounded-[10px] border border-line/40 bg-bg px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-gold-bright";

export default function Booking() {
  const { t } = useLocale();
  const b = t.booking;
  const [status, setStatus] = useState<Status>("idle");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  // Controlled so a doctor or service card elsewhere on the page can pre-select them (see lib/booking-prefill.ts).
  const [service, setService] = useState("");
  const [branch, setBranch] = useState("");
  const [doctor, setDoctor] = useState<string | null>(null);
  const account = useAccount();

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const d = (e as CustomEvent<BookingPrefill>).detail;
      if (d.service) setService(d.service);
      if (d.branch) setBranch(d.branch);
      setDoctor(d.doctor ?? null);
      setStatus("idle");
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!date || !time) {
      setStatus("invalid");
      return;
    }
    const fields = Object.fromEntries(new FormData(form));
    const data = { ...fields, date, time, doctor };
    setStatus("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { token } = (await res.json().catch(() => ({}))) as { token?: string | null };
        if (token) {
          recordBooking(
            { name: String(fields.name).trim(), phone: String(fields.phone).trim(), email: String(fields.email).trim() },
            {
              token,
              service: service as AccountBooking["service"],
              branch: branch as AccountBooking["branch"],
              slotDate: date,
              slotTime: time,
              doctor,
            },
          );
        }
        form.reset();
        setDate(null);
        setTime(null);
        setService("");
        setBranch("");
        setDoctor(null);
        setStatus("success");
      } else {
        setStatus(res.status === 400 ? "invalid" : "error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="booking" className="scroll-anchor bg-bg">
      <div className="mx-auto max-w-[720px] px-6 py-12 md:py-16">
        <Eyebrow text={b.eyebrow} />
        <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{b.heading}</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{b.intro}</p>

        <form
          key={account ? "account" : "guest"}
          onSubmit={onSubmit}
          className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-line/25 bg-surface p-6 md:grid-cols-2"
        >
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <label className="text-[13px] font-bold text-ink-soft md:col-span-2">
            {b.name}
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              defaultValue={account?.name}
              className={fieldClass}
            />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.phone}
            <input
              name="phone"
              type="tel"
              required
              dir="ltr"
              autoComplete="tel"
              defaultValue={account?.phone}
              className={`${fieldClass} text-start`}
            />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.email}
            <input
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              defaultValue={account?.email}
              className={`${fieldClass} text-start`}
            />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.service}
            <select name="service" required value={service} onChange={(e) => setService(e.target.value)} className={fieldClass}>
              <option value="" disabled>
                {b.select}
              </option>
              {t.services.map((s) => (
                <option key={s.icon} value={s.icon}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.branch}
            <select name="branch" required value={branch} onChange={(e) => setBranch(e.target.value)} className={fieldClass}>
              <option value="" disabled>
                {b.select}
              </option>
              {t.branches.map((br) => (
                <option key={br.id} value={br.id}>
                  {br.name}
                </option>
              ))}
            </select>
          </label>

          {doctor && (
            <div className="flex items-center gap-3 rounded-xl border border-gold-bright/50 bg-surface2 px-4 py-3 md:col-span-2">
              <UserRound size={18} className="shrink-0 text-gold" />
              <span className="flex-1 text-[14px]">
                <span className="text-ink-soft">{b.doctor}: </span>
                <span className="font-bold text-ink">{doctor}</span>
              </span>
              <button
                type="button"
                onClick={() => setDoctor(null)}
                aria-label={b.removeDoctor}
                className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-surface hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <SlotPicker
            date={date}
            time={time}
            onDate={(d) => {
              setDate(d);
              setTime(null);
            }}
            onTime={setTime}
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02] disabled:opacity-60 md:col-span-2"
          >
            {status === "sending" ? b.sending : b.submit}
          </button>

          <div aria-live="polite" className="text-[14px] md:col-span-2">
            {status === "success" && <p className="text-gold">{b.success}</p>}
            {status === "error" && <p className="text-red-600">{b.error}</p>}
            {status === "invalid" && <p className="text-red-600">{b.invalid}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
