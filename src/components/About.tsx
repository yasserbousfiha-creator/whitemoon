"use client";

import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import QualityBadgeCard from "./QualityBadgeCard";

export default function About() {
  const { t } = useLocale();

  return (
    <section id="about" className="scroll-anchor bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-[52px] md:py-[76px]">
        <Eyebrow text={t.aboutEyebrow} />
        <h2 className="mt-3 font-display text-[28px] text-ink md:text-[38px]">{t.aboutHeading}</h2>

        <div className="mt-[22px] max-w-[680px] space-y-4">
          <p className="text-[15.5px] leading-loose text-ink-soft">{t.aboutBody1}</p>
          <p className="text-[15.5px] leading-loose text-ink-soft">{t.aboutBody2}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3.5 md:grid-cols-4">
          {t.badges.map((b) => (
            <QualityBadgeCard key={b.title} badge={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
