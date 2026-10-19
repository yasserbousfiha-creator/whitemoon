"use client";

import Image from "next/image";
import { CalendarCheck, Images, MapPin, Stethoscope } from "lucide-react";
import { useState } from "react";
import type { ServiceContent, TeamMember } from "@/lib/content";
import { inBranch, useBranch } from "@/lib/branch-context";
import { prefillBooking } from "@/lib/booking-prefill";
import { teamMember, useDoctors } from "@/lib/doctors-context";
import { useLocale } from "@/lib/locale-context";
import CasesViewer from "./CasesViewer";
import Eyebrow from "./Eyebrow";
import { serviceIconMap } from "./icon-map";

// Named doctors grouped by department (dentistry, dermatology…), each with their branch and a one-tap
// "book with" that fills in the booking form. A branch page lists only that branch's doctors. The smaller
// departments (gynecology, pediatrics, general medicine) share one row, each card tagged with its department.
const MAIN_DEPARTMENTS: ServiceContent["icon"][] = ["dentistry", "derma", "laser"];

function DepartmentHeading({ icon, title }: { icon: ServiceContent["icon"] | null; title: string }) {
  const Icon = icon ? serviceIconMap[icon] : Stethoscope;
  return (
    <h3 className="flex items-center gap-3 font-display text-[19px] text-ink">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-surface">
        <Icon size={18} className="text-gold" />
      </span>
      {title}
      <span className="h-px flex-1 bg-line/30" />
    </h3>
  );
}

function DoctorCard({
  d,
  service,
  onCases,
}: {
  d: TeamMember;
  service: ServiceContent["icon"];
  onCases: () => void;
}) {
  const { t } = useLocale();
  return (
    <article
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
        {/* On every doctor; photos come from the doctor's cases (doctors table), until then it says "coming soon". */}
        {d.name ? (
          <button
            type="button"
            onClick={onCases}
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
            prefillBooking({ service, branch: d.branch, doctor: d.name, doctorId: d.id })
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
  );
}

const grid = "mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5";

export default function DoctorsSection() {
  const { t, isArabic } = useLocale();
  const branch = useBranch();
  const doctors = useDoctors();
  const [cases, setCases] = useState<TeamMember | null>(null);
  const departments = t.services
    .map((s) => ({
      service: s,
      doctors: doctors
        .filter((d) => d.service === s.icon && d.photo && inBranch(branch, d.branch))
        .map((d) => teamMember(d, isArabic)),
    }))
    .filter((d) => d.doctors.length > 0);
  const main = departments.filter((d) => MAIN_DEPARTMENTS.includes(d.service.icon));
  const others = departments.filter((d) => !MAIN_DEPARTMENTS.includes(d.service.icon));
  // A branch without listed doctors yet still gets the section, with a "coming soon" line.
  if (departments.length === 0 && !branch) return null;

  return (
    <section id="doctors" className="scroll-anchor bg-surface2">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="max-w-[620px]">
          <Eyebrow text={t.doctorsEyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.doctorsHeading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{t.doctorsIntro}</p>
        </div>

        {departments.length === 0 && (
          <p className="mt-8 rounded-2xl border border-dashed border-line/40 bg-surface p-6 text-center text-[15px] text-ink-soft">
            {t.branchDoctorsSoon}
          </p>
        )}

        {main.map(({ service, doctors }) => (
          <div key={service.icon} className="mt-10">
            <DepartmentHeading icon={service.icon} title={service.title} />
            <div className={grid}>
              {doctors.map((d) => (
                <DoctorCard key={d.id ?? d.name} d={d} service={service.icon} onCases={() => setCases(d)} />
              ))}
            </div>
          </div>
        ))}

        {others.length > 0 && (
          <div className="mt-10">
            {/* A single smaller department keeps its own name as the heading. */}
            <DepartmentHeading
              icon={others.length === 1 ? others[0].service.icon : null}
              title={others.length === 1 ? others[0].service.title : t.otherSpecialties}
            />
            <div className={grid}>
              {others.flatMap(({ service, doctors }) =>
                doctors.map((d) => {
                  const Icon = serviceIconMap[service.icon];
                  return (
                    <div key={d.id ?? d.name} className="flex flex-col gap-2 [&>article]:flex-1">
                      {others.length > 1 && (
                        <p className="flex items-center justify-center gap-1.5 text-[13.5px] font-bold text-ink">
                          <Icon size={15} className="text-gold" />
                          {service.title}
                        </p>
                      )}
                      <DoctorCard d={d} service={service.icon} onCases={() => setCases(d)} />
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        )}
      </div>
      {cases && (
        <CasesViewer
          title={`${t.casesLabel} · ${cases.name}`}
          photos={cases.cases ?? []}
          empty={t.casesEmpty}
          onClose={() => setCases(null)}
        />
      )}
    </section>
  );
}
