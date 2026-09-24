"use client";

import { useLocale } from "@/lib/locale-context";
import { serviceIconMap } from "./icon-map";

function scrollToServices() {
  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
}

export default function SpecialtyHighlights() {
  const { t } = useLocale();

  return (
    <section className="bg-surface">
      <div className="mx-auto flex max-w-[1160px] flex-wrap justify-center px-6 md:flex-nowrap">
        {t.services.map((s) => {
          const Icon = serviceIconMap[s.icon];
          return (
            <button
              key={s.title}
              type="button"
              onClick={scrollToServices}
              className="flex w-[120px] flex-1 flex-col items-center gap-3 py-[18px] transition-transform hover:-translate-y-0.5 md:w-auto"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-surface2">
                <Icon size={22} className="text-gold" />
              </span>
              <span className="text-center text-[13px] font-bold text-ink">{s.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
