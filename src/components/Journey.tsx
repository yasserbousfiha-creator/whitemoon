"use client";

import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import JourneyPhaseCard from "./JourneyPhaseCard";

// The one dark band on the page (user's choice 2026-10-29): night with gold, between the doctors and the booking
// form, so the long cream page gets a calm, luxurious pause.
export default function Journey() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-night2">
      {/* A moon-like glow in one corner, and gold hairlines at the band's edges. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 end-[-10%] h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(232,200,119,0.16),rgba(232,200,119,0)_68%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/50 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-bright/50 to-transparent" />

      <div className="relative mx-auto max-w-[1160px] px-6 py-[60px] md:py-[84px]">
        <div className="max-w-[560px]">
          <Eyebrow text={t.journeyEyebrow} onNight />
          <h2 className="mt-2.5 font-display text-[24px] text-bg md:text-[32px]">{t.journeyHeading}</h2>
        </div>

        <div className="relative mt-12 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
          <div className="pointer-events-none absolute inset-x-[7%] top-7 hidden h-px bg-gradient-to-r from-transparent via-gold-bright/45 to-transparent md:block" />
          {t.journeyPhases.map((p) => (
            <JourneyPhaseCard key={p.name} phase={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
