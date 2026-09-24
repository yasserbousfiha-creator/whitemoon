"use client";

import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import QualityBadgeCard from "./QualityBadgeCard";

export default function Intro() {
  const { t } = useLocale();

  return (
    <section className="bg-bg">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-8 px-6 py-14 md:flex-row md:py-16">
        <div className="flex-[9]">
          <Eyebrow text={t.introEyebrow} />
          <h2 className="mt-3 font-display text-[24px] leading-[1.35] text-ink md:text-[30px]">{t.introHeading}</h2>
          <p className="mt-4 max-w-[440px] text-[14.5px] leading-relaxed text-ink-soft">{t.introBody}</p>
        </div>

        <div className="grid flex-[11] grid-cols-1 gap-3.5 md:grid-cols-2">
          {t.badges.map((b) => (
            <QualityBadgeCard key={b.title} badge={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
