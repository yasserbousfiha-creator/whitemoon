"use client";

import { CalendarCheck, MapPin, MessageCircle, MessageSquareText, Phone, SendHorizontal, X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import type { BranchId } from "@/lib/booking-labels";
import { prefillBooking } from "@/lib/booking-prefill";
import { useBranch } from "@/lib/branch-context";
import { type Intent, understand } from "@/lib/chat";
import { branchContacts, contentFor } from "@/lib/content";
import { useDoctors } from "@/lib/doctors-context";
import { type Doctor, type Shift, weekday } from "@/lib/doctors";
import { useLocale } from "@/lib/locale-context";
import { offerTitle, riyadhToday } from "@/lib/offers";
import { useOffers } from "@/lib/offers-context";
import { bookOffer } from "./OfferCard";

type Reply = Intent | { kind: "welcome" } | { kind: "pickBranch" } | { kind: "branchDoctors"; branch: BranchId };
type Message = { id: number; from: "user"; text: string } | { id: number; from: "bot"; reply: Reply };

const DAY_NAMES = {
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
// The week as it is read in Saudi Arabia, Saturday first.
const WEEK = [6, 0, 1, 2, 3, 4, 5];

// Days with the same shifts on one line ("Saturday, Sunday…: 1:30 PM – 9:30 PM").
function groupDays(hours: Doctor["hours"]) {
  const groups: { days: number[]; shifts: Shift[] }[] = [];
  for (const day of WEEK) {
    const shifts = hours[day] ?? [];
    const same = groups.find((g) => JSON.stringify(g.shifts) === JSON.stringify(shifts));
    if (same) same.days.push(day);
    else groups.push({ days: [day], shifts });
  }
  return groups;
}

const chip =
  "shrink-0 rounded-full border border-gold/40 bg-surface px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-gold-bright hover:bg-gold-bright/15";
const action =
  "inline-flex items-center gap-1.5 rounded-full bg-gold-bright px-3 py-1.5 text-[13px] font-medium text-night2 transition-transform hover:scale-[1.03]";

// A floating chat that answers from the site's own data (doctors' hours, live offers, branches) without any AI
// service: lib/chat.ts reads what was typed, the buttons cover the common questions, and anything it can't answer
// goes to WhatsApp or the booking form.
export default function ChatAssistant() {
  const { t, isArabic, locale } = useLocale();
  const c = t.chat;
  const doctors = useDoctors();
  const offers = useOffers();
  const pageBranch = useBranch();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: "bot", reply: { kind: "welcome" } }]);
  const nextId = useRef(1);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // "Which doctor?" asks for the branch first, except on a branch page.
  const resolve = (r: Reply): Reply =>
    r.kind === "pickDoctor" ? (pageBranch ? { kind: "branchDoctors", branch: pageBranch } : { kind: "pickBranch" }) : r;

  function say(text: string, reply: Reply) {
    const [a, b] = [nextId.current++, nextId.current++];
    setMessages((m) => [...m, { id: a, from: "user", text }, { id: b, from: "bot", reply: resolve(reply) }]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    say(text, understand(text, doctors));
  }

  const name = (d: Doctor) => (isArabic ? d.nameAr : d.nameEn);
  const branchName = (id: BranchId) => t.branches.find((b) => b.id === id)?.name ?? id;
  const serviceName = (id: string) => t.services.find((s) => s.icon === id)?.title ?? id;
  const days = DAY_NAMES[locale];
  const time = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = isArabic ? (h < 12 ? "ص" : "م") : h < 12 ? "AM" : "PM";
    return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
  };
  const shiftsText = (shifts: Shift[]) =>
    shifts.length ? shifts.map(([a, b]) => `${time(a)} – ${time(b)}`).join(isArabic ? " و " : " & ") : c.dayOff;
  const price = (n: number) => `${n.toLocaleString(isArabic ? "ar-SA-u-nu-latn" : "en-US")} ${t.offers.currency}`;

  const whatsapp = (
    <a href={t.whatsappUrl} target="_blank" rel="noopener noreferrer" className={action}>
      <MessageCircle size={14} />
      {c.askTeam}
    </a>
  );

  const doctorChips = (list: Doctor[], day: number | null = null, showBranch = !pageBranch) =>
    list.length ? (
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((d) => (
          <button key={d.id} type="button" className={chip} onClick={() => say(name(d), { kind: "doctors", ids: [d.id], day })}>
            {name(d)}
            {showBranch && <span className="text-ink-soft"> · {branchName(d.branch)}</span>}
          </button>
        ))}
      </div>
    ) : (
      <p className="mt-1 text-ink-soft">{c.noDoctors}</p>
    );

  function doctorHours(d: Doctor, day: number | null) {
    const today = weekday(riyadhToday());
    const asked = day ?? today;
    const label = asked === today ? `${c.today} (${days[asked]})` : c.onDay.replace("{day}", days[asked]);
    return (
      <div>
        <div className="flex items-center gap-3">
          {d.photo && (
            // eslint-disable-next-line @next/next/no-img-element -- small avatar
            <img src={d.photo} alt="" className="h-11 w-11 shrink-0 rounded-full bg-surface object-cover object-top" />
          )}
          <div>
            <p className="font-medium">{name(d)}</p>
            <p className="text-[12.5px] text-ink-soft">
              {isArabic ? d.roleAr : d.roleEn} · {branchName(d.branch)}
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-gold-bright/15 px-2.5 py-1.5">
          <strong>{label}:</strong> {shiftsText(d.hours[asked] ?? [])}
        </p>
        <ul className="mt-2 space-y-1 text-[13px]">
          {groupDays(d.hours).map((g) => (
            <li key={g.days.join()}>
              <span className="text-ink-soft">
                {g.days.length === 7 ? c.daily : g.days.map((n) => days[n]).join(isArabic ? "، " : ", ")}:
              </span>{" "}
              {shiftsText(g.shifts)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] text-ink-soft">{c.hoursNote}</p>
        <button
          type="button"
          className={`${action} mt-2`}
          onClick={() => {
            prefillBooking({ service: d.service, branch: d.branch, doctor: name(d), doctorId: d.id });
            setOpen(false);
          }}
        >
          <CalendarCheck size={14} />
          {c.bookWith.replace("{name}", name(d))}
        </button>
      </div>
    );
  }

  function render(r: Reply): ReactNode {
    switch (r.kind) {
      case "welcome":
        return c.welcome;
      case "greeting":
        return c.greeting;
      case "thanks":
        return c.thanks;
      case "doctors": {
        const found = r.ids.map((id) => doctors.find((d) => d.id === id)).filter((d): d is Doctor => !!d);
        if (found.length === 1) return doctorHours(found[0], r.day);
        return (
          <>
            {c.manyDoctors}
            {doctorChips(found, r.day, true)}
          </>
        );
      }
      case "pickDoctor":
      case "pickBranch":
        return (
          <>
            {c.pickBranch}
            <div className="mt-2 flex flex-wrap gap-2">
              {t.branches.map((b) => (
                <button key={b.id} type="button" className={chip} onClick={() => say(b.name, { kind: "branchDoctors", branch: b.id })}>
                  {b.name}
                </button>
              ))}
            </div>
          </>
        );
      case "branchDoctors":
        return (
          <>
            {c.pickDoctor.replace("{branch}", branchName(r.branch))}
            {doctorChips(doctors.filter((d) => d.branch === r.branch), null, false)}
          </>
        );
      case "department": {
        const where = r.branch ?? pageBranch;
        return (
          <>
            {c.departmentDoctors.replace("{service}", serviceName(r.service))}
            {doctorChips(doctors.filter((d) => d.service === r.service && (!where || d.branch === where)))}
          </>
        );
      }
      case "offers": {
        const found = offers.filter((o) => !r.service || o.service === r.service);
        const service = r.service ? serviceName(r.service) : "";
        if (found.length === 0)
          return (
            <>
              {r.prices ? c.prices : r.service ? c.noOffersFor.replace("{service}", service) : c.noOffers}
              <div className="mt-2">{whatsapp}</div>
            </>
          );
        return (
          <>
            {r.prices && <p className="mb-2">{c.prices}</p>}
            {r.service ? c.offersFor.replace("{service}", service) : c.offersIntro}
            <ul className="mt-2 space-y-2">
              {found.map((o) => (
                <li key={o.id} className="flex gap-2.5 rounded-xl border border-line/20 bg-surface p-2">
                  {o.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- the offer's design, as a thumbnail
                    <img src={o.image} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-surface2 object-cover" loading="lazy" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium leading-snug">{offerTitle(o, isArabic)}</p>
                    {(o.priceAfter !== null || o.priceBefore !== null) && (
                      <p className="mt-0.5 text-[12.5px]">
                        {o.priceBefore !== null && o.priceAfter !== null && (
                          <span className="me-1.5 text-ink-soft line-through">{price(o.priceBefore)}</span>
                        )}
                        <span className="font-semibold text-gold">{price(o.priceAfter ?? o.priceBefore!)}</span>
                      </p>
                    )}
                    <p className="mt-0.5 text-[12px] text-ink-soft">
                      {o.branches.length ? o.branches.map(branchName).join(isArabic ? "، " : ", ") : t.offers.allBranches}
                      {o.endsOn && ` · ${t.offers.endsOn.replace("{date}", o.endsOn.split("-").reverse().slice(0, 2).join("/"))}`}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-[12.5px] font-medium text-gold underline-offset-4 hover:underline"
                      onClick={() => {
                        bookOffer(o, pageBranch);
                        setOpen(false);
                      }}
                    >
                      {t.offers.book}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        );
      }
      case "branches": {
        const base = contentFor(locale);
        return (
          <>
            {c.branchesIntro}
            <ul className="mt-2 space-y-2">
              {t.branches
                .filter((b) => !r.branch || b.id === r.branch)
                .map((b) => {
                  const own = branchContacts[b.id];
                  const phone = own?.phone ?? base.phone;
                  return (
                    <li key={b.id} className="rounded-xl border border-line/20 bg-surface p-2.5">
                      <p className="font-medium">{b.name}</p>
                      <p className="text-[12.5px] text-ink-soft">{b.address}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-gold">
                        <a href={b.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                          <MapPin size={13} />
                          {c.map}
                        </a>
                        <a href={`tel:${phone}`} className="inline-flex items-center gap-1 hover:underline">
                          <Phone size={13} />
                          <span dir="ltr">{own?.phoneDisplay ?? base.phoneDisplay}</span>
                        </a>
                        <a
                          href={own?.whatsappUrl ?? base.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <MessageCircle size={13} />
                          {c.whatsapp}
                        </a>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </>
        );
      }
      case "hours":
        return (
          <>
            {c.hours.replace("{value}", t.workingHoursValue)}
            <div className="mt-2">
              <button type="button" className={chip} onClick={() => say(c.quick.doctors, { kind: "pickDoctor" })}>
                {c.quick.doctors}
              </button>
            </div>
          </>
        );
      case "book":
        return (
          <>
            {c.book}
            <div className="mt-2">
              <a href="#booking" className={action} onClick={() => setOpen(false)}>
                <CalendarCheck size={14} />
                {c.bookButton}
              </a>
            </div>
          </>
        );
      case "contact":
        return (
          <>
            {c.contact}
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={t.whatsappUrl} target="_blank" rel="noopener noreferrer" className={action}>
                <MessageCircle size={14} />
                {c.whatsapp}
              </a>
              <a href={`tel:${t.phone}`} className={chip}>
                <span dir="ltr">{t.phoneDisplay}</span>
              </a>
            </div>
          </>
        );
      case "unknown":
        return (
          <>
            {c.unknown}
            <div className="mt-2">{whatsapp}</div>
          </>
        );
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? c.close : c.open}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open && window.matchMedia("(pointer: fine)").matches) setTimeout(() => input.current?.focus(), 50);
        }}
        className="grid h-14 w-14 place-items-center rounded-full border border-gold-bright/60 bg-night2 text-gold-glow shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageSquareText size={24} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={c.title}
          className="fixed bottom-[10.25rem] end-4 z-50 flex h-[min(580px,calc(100svh-13rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line/25 bg-bg text-[14px] shadow-2xl sm:end-6"
        >
          <div className="flex items-center gap-3 bg-night2 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- the logo */}
            <img src="/images/logo-mark.png" alt="" className="h-9 w-9 rounded-full bg-bg object-contain p-0.5" />
            <div className="flex-1">
              <p className="font-display text-[15px] text-gold-glow">{c.title}</p>
              <p className="text-[12px] text-white/60">{c.subtitle}</p>
            </div>
            <button type="button" aria-label={c.close} onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div ref={list} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {messages.map((m) =>
              m.from === "user" ? (
                <p key={m.id} className="max-w-[85%] self-end whitespace-pre-line rounded-2xl rounded-ee-sm bg-gold-bright px-3 py-2 text-night2">
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className="max-w-[92%] self-start rounded-2xl rounded-es-sm bg-surface2 px-3 py-2 leading-relaxed text-ink">
                  {render(m.reply)}
                </div>
              ),
            )}
          </div>

          <div className="border-t border-line/20 bg-surface">
            <div className="flex gap-2 overflow-x-auto px-3 pt-2.5 pb-0.5">
              <button type="button" className={chip} onClick={() => say(c.quick.offers, { kind: "offers", service: null, prices: false })}>
                {c.quick.offers}
              </button>
              <button type="button" className={chip} onClick={() => say(c.quick.doctors, { kind: "pickDoctor" })}>
                {c.quick.doctors}
              </button>
              <button type="button" className={chip} onClick={() => say(c.quick.branches, { kind: "branches", branch: null })}>
                {c.quick.branches}
              </button>
              <button type="button" className={chip} onClick={() => say(c.quick.book, { kind: "book" })}>
                {c.quick.book}
              </button>
              <a href={t.whatsappUrl} target="_blank" rel="noopener noreferrer" className={chip}>
                {c.quick.whatsapp}
              </a>
            </div>
            <form onSubmit={onSubmit} className="flex items-center gap-2 p-3">
              <input
                ref={input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={c.placeholder}
                maxLength={300}
                className="min-w-0 flex-1 rounded-full border border-line/40 bg-bg px-4 py-2 text-[16px] text-ink outline-none focus:border-gold-bright sm:text-[14px]"
              />
              <button
                type="submit"
                aria-label={c.send}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-bright text-night2 disabled:opacity-50"
                disabled={!draft.trim()}
              >
                <SendHorizontal size={18} className={isArabic ? "-scale-x-100" : ""} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
