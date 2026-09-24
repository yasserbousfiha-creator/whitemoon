"use client";

import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import JourneyPhaseCard from "./JourneyPhaseCard";

export default function Journey() {
  const { t } = useLocale();

  return (
    <section className="bg-surface2">
      <div className="mx-auto max-w-[1160px] px-6 py-[52px] md:py-[70px]">
        <div className="max-w-[560px]">
          <Eyebrow text={t.journeyEyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.journeyHeading}</h2>
        </div>

        <div className="relative mt-11 grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4">
          <div className="pointer-events-none absolute inset-x-[7%] top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent md:block" />
          {t.journeyPhases.map((p) => (
            <JourneyPhaseCard key={p.name} phase={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
