"use client";

import { offeredIn, useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import { useServicesUI } from "@/lib/services-ui-context";
import Eyebrow from "./Eyebrow";
import ServiceCard from "./ServiceCard";

export default function Services() {
  const { t } = useLocale();
  const { setExpandedIcon } = useServicesUI();
  const branch = useBranch();
  // Rows of three on wide screens; a card opening only narrows the others in its own row.
  const services = t.services.filter((s) => offeredIn(branch, s));
  const rows = Array.from({ length: Math.ceil(services.length / 3) }, (_, i) => services.slice(i * 3, i * 3 + 3));

  return (
    <section id="services" className="scroll-anchor bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="max-w-[620px]">
          <Eyebrow text={t.servicesEyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.servicesHeading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{t.servicesIntro}</p>
        </div>

        <div className="mt-8 flex flex-col gap-5">
          {rows.map((row) => (
            <div
              key={row[0].icon}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setExpandedIcon(null);
              }}
              className="flex flex-col items-stretch gap-5 md:flex-row"
            >
              {row.map((s) => (
                <ServiceCard key={s.title} service={s} row={row.map((r) => r.icon)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
