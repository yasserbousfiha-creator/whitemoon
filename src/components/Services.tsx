"use client";

import { useLocale } from "@/lib/locale-context";
import { useServicesUI } from "@/lib/services-ui-context";
import Eyebrow from "./Eyebrow";
import ServiceCard from "./ServiceCard";

export default function Services() {
  const { t } = useLocale();
  const { setExpandedIcon } = useServicesUI();

  return (
    <section id="services" className="scroll-anchor bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="max-w-[620px]">
          <Eyebrow text={t.servicesEyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.servicesHeading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{t.servicesIntro}</p>
        </div>

        <div
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setExpandedIcon(null);
          }}
          className="mt-8 flex flex-col items-stretch gap-5 md:flex-row"
        >
          {t.services.map((s) => (
            <ServiceCard key={s.title} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
