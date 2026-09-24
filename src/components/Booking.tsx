"use client";

import { FormEvent, useState } from "react";
import { addEntry } from "@/lib/contest";
import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";

type Status = "idle" | "sending" | "success" | "error" | "invalid";

const fieldClass =
  "mt-1.5 w-full rounded-[10px] border border-line/40 bg-bg px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-gold-bright";

export default function Booking() {
  const { t } = useLocale();
  const b = t.booking;
  const [status, setStatus] = useState<Status>("idle");
  const [entryNumber, setEntryNumber] = useState<number | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setEntryNumber(addEntry(String(data.name), String(data.phone)));
        form.reset();
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

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-2xl border border-line/25 bg-surface p-6 md:grid-cols-2">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <label className="text-[13px] font-bold text-ink-soft md:col-span-2">
            {b.name}
            <input name="name" required minLength={2} maxLength={100} autoComplete="name" className={fieldClass} />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.phone}
            <input name="phone" type="tel" required dir="ltr" autoComplete="tel" className={`${fieldClass} text-start`} />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.email}
            <input name="email" type="email" required dir="ltr" autoComplete="email" className={`${fieldClass} text-start`} />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.service}
            <select name="service" required defaultValue="" className={fieldClass}>
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
            <select name="branch" required defaultValue="" className={fieldClass}>
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

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02] disabled:opacity-60 md:col-span-2"
          >
            {status === "sending" ? b.sending : b.submit}
          </button>

          <div aria-live="polite" className="text-[14px] md:col-span-2">
            {status === "success" && (
              <>
                <p className="text-gold">{b.success}</p>
                {entryNumber !== null && (
                  <p className="mt-1 font-bold text-ink">
                    {t.contest.entered} #{entryNumber}
                  </p>
                )}
              </>
            )}
            {status === "error" && <p className="text-red-600">{b.error}</p>}
            {status === "invalid" && <p className="text-red-600">{b.invalid}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
