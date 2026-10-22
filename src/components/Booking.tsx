"use client";

import { CircleCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type AccountBooking, recordBooking, useAccount } from "@/lib/account";
import { PREFILL_EVENT, type BookingPrefill } from "@/lib/booking-prefill";
import { isBranchId } from "@/lib/branches";
import { offeredIn, useBranch } from "@/lib/branch-context";
import type { ServiceContent } from "@/lib/content";
import { useDoctor, useTeam } from "@/lib/doctors-context";
import { useLocale } from "@/lib/locale-context";
import { offerIn, offerTitle } from "@/lib/offers";
import { useOffer } from "@/lib/offers-context";
import Eyebrow from "./Eyebrow";
import RequiredMark from "./RequiredMark";
import SlotPicker from "./SlotPicker";

type Status = "idle" | "sending" | "success" | "error" | "invalid" | "unavailable";

// Once a send was tried, the required fields still empty get a red border (the form has class "tried").
const fieldClass =
  "mt-1.5 w-full rounded-[10px] border border-line/40 bg-bg px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-gold-bright [.tried_&:invalid]:border-red-500";

export default function Booking() {
  const { t, isArabic } = useLocale();
  const b = t.booking;
  const [status, setStatus] = useState<Status>("idle");
  const [tried, setTried] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  // Controlled so a doctor or service card elsewhere on the page can pre-select them (see lib/booking-prefill.ts).
  const [service, setService] = useState("");
  // A branch page books at that branch unless the visitor picks another.
  const pageBranch = useBranch();
  const [branch, setBranch] = useState<string>(pageBranch ?? "");
  const [doctor, setDoctor] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [availabilityKey, setAvailabilityKey] = useState(0);
  const account = useAccount();
  const pickedDoctor = useDoctor(doctorId);
  // Set by "book this offer"; kept until the visitor removes it or picks a branch the offer is not at.
  const [offerId, setOfferId] = useState<number | null>(null);
  const offer = useOffer(offerId);

  // Switching to a branch or department the chosen doctor does not work in drops the doctor, and the day/time
  // picked from their schedule.
  function dropDoctorUnless(field: "branch" | "service", value: string) {
    if (!pickedDoctor || pickedDoctor[field] === value) return;
    setDoctor(null);
    setDoctorId(null);
    setDate(null);
    setTime(null);
  }

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const d = (e as CustomEvent<BookingPrefill>).detail;
      if (d.service) setService(d.service);
      if (d.branch) setBranch(d.branch);
      setDoctor(d.doctor ?? null);
      setDoctorId(d.doctorId ?? null);
      setOfferId(d.offerId ?? null);
      // Another doctor's hours differ, so a previously picked slot may not exist for this one.
      setDate(null);
      setTime(null);
      setStatus("idle");
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  // Departments some branches lack (gynecology…) are listed only once a branch that has them is picked, or none yet.
  const serviceChoices = t.services.filter((s) => offeredIn(isBranchId(branch) ? branch : null, s));

  const doctorChoices = useTeam(service as ServiceContent["icon"]).filter(
    (m): m is typeof m & { id: string; name: string } => !!m.id && !!m.name && m.branch === branch,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!date || !time) {
      setTried(true);
      setStatus("invalid");
      return;
    }
    const fields = Object.fromEntries(new FormData(form));
    const data = { ...fields, date, time, doctor, doctorId, offerId: offer ? offer.id : null };
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
            {
              name: String(fields.name).trim(),
              phone: String(fields.phone).trim(),
              email: String(fields.email).trim(),
            },
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
        setBranch(pageBranch ?? "");
        setDoctor(null);
        setDoctorId(null);
        setOfferId(null);
        setTried(false);
        setStatus("success");
      } else {
        if (res.status === 409) {
          // Taken or closed since the form loaded: refresh the red slots and ask for another time.
          setTime(null);
          setAvailabilityKey((k) => k + 1);
          setStatus("unavailable");
        } else setStatus(res.status === 400 ? "invalid" : "error");
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
          // The browser stops a send with an empty required field before onSubmit runs; mark them all then.
          onInvalidCapture={() => setTried(true)}
          className={`${tried ? "tried " : ""}mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-line/25 bg-surface p-6 md:grid-cols-2`}
        >
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {offer && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gold-bright/50 bg-surface2 px-4 py-2.5 text-[14px] md:col-span-2">
              <span>
                <span className="font-bold text-gold">{t.offers.bookingOffer}:</span> {offerTitle(offer, isArabic)}
              </span>
              <button
                type="button"
                onClick={() => setOfferId(null)}
                className="shrink-0 text-[13px] text-ink-soft underline hover:text-ink"
              >
                {t.offers.removeOffer}
              </button>
            </div>
          )}

          <label className="text-[13px] font-bold text-ink-soft md:col-span-2">
            {b.name}
            <RequiredMark />
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
            <RequiredMark />
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
              dir="ltr"
              autoComplete="email"
              defaultValue={account?.email}
              className={`${fieldClass} text-start`}
            />
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.service}
            <RequiredMark />
            <select
              name="service"
              required
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                dropDoctorUnless("service", e.target.value);
              }}
              className={fieldClass}
            >
              <option value="" disabled>
                {b.select}
              </option>
              {serviceChoices.map((s) => (
                <option key={s.icon} value={s.icon}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[13px] font-bold text-ink-soft">
            {b.branch}
            <RequiredMark />
            <select
              name="branch"
              required
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                dropDoctorUnless("branch", e.target.value);
                if (offer && isBranchId(e.target.value) && !offerIn(offer, e.target.value)) setOfferId(null);
                const picked = t.services.find((s) => s.icon === service);
                if (picked && isBranchId(e.target.value) && !offeredIn(e.target.value, picked)) setService("");
              }}
              className={fieldClass}
            >
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

          {/* Optional: the doctors of the chosen department at the chosen branch; "any" books without one. */}
          <label className="text-[13px] font-bold text-ink-soft md:col-span-2">
            {b.doctorOptional}
            <select
              value={doctorId ?? ""}
              disabled={doctorChoices.length === 0}
              onChange={(e) => {
                const picked = doctorChoices.find((m) => m.id === e.target.value);
                setDoctorId(picked?.id ?? null);
                setDoctor(picked?.name ?? null);
                // Each doctor has their own hours, so the day/time is picked again.
                setDate(null);
                setTime(null);
              }}
              className={`${fieldClass} disabled:opacity-60`}
            >
              <option value="">{service && branch ? b.anyDoctor : b.doctorPickFirst}</option>
              {doctorChoices.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
          </label>

          <SlotPicker
            date={date}
            time={time}
            onDate={(d) => {
              setDate(d);
              setTime(null);
            }}
            onTime={setTime}
            doctor={pickedDoctor}
            refreshKey={availabilityKey}
            showMissing={tried}
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02] disabled:opacity-60 md:col-span-2"
          >
            {status === "sending" ? b.sending : b.submit}
          </button>

          <div aria-live="polite" className="text-[14px] md:col-span-2">
            {status === "error" && <p className="text-red-600">{b.error}</p>}
            {status === "invalid" && <p className="text-red-600">{b.invalid}</p>}
            {status === "unavailable" && <p className="text-red-600">{b.unavailable}</p>}
          </div>
        </form>
      </div>
      {status === "success" && <BookingReceived onClose={() => setStatus("idle")} />}
    </section>
  );
}

// Shown over the page once a booking was sent, so the patient can't miss that it went through.
function BookingReceived({ onClose }: { onClose: () => void }) {
  const b = useLocale().t.booking;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-received"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="branch-picker fixed inset-0 z-[100] flex overflow-y-auto bg-night2/55 p-4 backdrop-blur-sm"
    >
      <div className="branch-picker-card m-auto w-full max-w-[380px] rounded-2xl bg-bg p-7 text-center shadow-[0_30px_80px_-20px_rgba(14,11,7,0.55)]">
        <CircleCheck size={52} strokeWidth={1.6} className="mx-auto text-gold-bright" aria-hidden />
        <h3 id="booking-received" className="mt-4 font-display text-[22px] text-ink">
          {b.successTitle}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{b.success}</p>
        <p className="mt-3 text-[14px] text-gold">{b.successWish}</p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02]"
        >
          {b.successClose}
        </button>
      </div>
    </div>,
    document.body,
  );
}
