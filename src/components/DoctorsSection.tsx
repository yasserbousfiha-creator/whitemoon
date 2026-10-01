"use client";

import Image from "next/image";
import { CalendarCheck, Images, MapPin } from "lucide-react";
import { useState } from "react";
import type { TeamMember } from "@/lib/content";
import { prefillBooking } from "@/lib/booking-prefill";
import { useLocale } from "@/lib/locale-context";
import CasesViewer from "./CasesViewer";
import Eyebrow from "./Eyebrow";
import { serviceIconMap } from "./icon-map";

// Named doctors grouped by department (dentistry, dermatology…), each with their branch and a one-tap
// "book with" that fills in the booking form.
export default function DoctorsSection() {
  const { t } = useLocale();
  const [cases, setCases] = useState<TeamMember | null>(null);
  const departments = t.services
    .map((s) => ({ service: s, doctors: s.team.filter((m) => m.name && m.photo) }))
    .filter((d) => d.doctors.length > 0);
  if (departments.length === 0) return null;

  return (
    <section id="doctors" className="scroll-anchor bg-surface2">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="max-w-[620px]">
          <Eyebrow text={t.doctorsEyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.doctorsHeading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{t.doctorsIntro}</p>
        </div>

        {departments.map(({ service, doctors }) => {
          const Icon = serviceIconMap[service.icon];
          return (
            <div key={service.icon} className="mt-10">
              <h3 className="flex items-center gap-3 font-display text-[19px] text-ink">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface">
                  <Icon size={18} className="text-gold" />
                </span>
                {service.title}
                <span className="h-px flex-1 bg-line/30" />
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
                {doctors.map((d) => (
                  <article
                    key={d.name}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-line/25 bg-surface transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-20px_rgba(156,122,46,0.45)]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-surface2">
                      <Image
                        src={d.portrait ?? d.photo!}
                        alt={d.name!}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                      {d.cases?.length ? (
                        <button
                          type="button"
                          onClick={() => setCases(d)}
                          className="absolute start-2 top-2 flex items-center gap-1.5 rounded-full bg-night2/75 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur transition-colors hover:bg-gold-bright hover:text-night2"
                        >
                          <Images size={14} />
                          {t.casesLabel}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-1 px-3 pt-3.5 pb-4 text-center">
                      <p className="text-[15px] font-bold text-ink">{d.name}</p>
                      <p className="text-[12.5px] leading-snug text-gold">{d.role}</p>
                      {d.branch && (
                        <p className="flex items-center gap-1 text-[12px] text-ink-soft">
                          <MapPin size={12} />
                          {t.branches.find((b) => b.id === d.branch)?.name}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          prefillBooking({ service: service.icon, branch: d.branch, doctor: d.name, doctorId: d.id })
                        }
                        className="mt-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gold-bright/60 px-3.5 py-1.5 text-[12.5px] font-bold text-gold transition-colors hover:bg-gold-bright hover:text-night2"
                      >
                        <CalendarCheck size={14} />
                        {/* The name is right above on phones, so keep the button to one line there. */}
                        <span className="md:hidden">{t.ctaBookNow}</span>
                        <span className="hidden md:inline">
                          {t.booking.bookWith} {d.name}
                        </span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {cases?.cases && (
        <CasesViewer title={`${t.casesLabel} · ${cases.name}`} photos={cases.cases} onClose={() => setCases(null)} />
      )}
    </section>
  );
}
