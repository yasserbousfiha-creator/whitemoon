"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  const { t } = useLocale();

  return (
    <section id="home" className="scroll-anchor relative overflow-hidden bg-bg">
      <div className="relative mx-auto flex max-w-[1160px] flex-col items-center gap-10 px-6 py-14 md:flex-row md:py-[76px]">
        <div className="order-2 flex-[6] md:order-1">
          <Eyebrow text={t.heroEyebrow} />
          <h1 className="mt-[18px] font-display text-[32px] leading-[1.28] text-ink md:text-[46px]">
            {t.heroHeadline}
          </h1>
          <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-ink-soft">{t.heroLede}</p>

          <div className="mt-7 flex flex-wrap gap-3.5">
            <a
              href={t.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.03]"
            >
              <MessageCircle size={18} />
              {t.ctaBookWhatsApp}
            </a>
            <button
              type="button"
              onClick={() => scrollToSection("services")}
              className="rounded-full border border-line/40 px-6 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-surface2"
            >
              {t.ctaExploreServices}
            </button>
          </div>
        </div>

        <div className="order-1 flex-[4] md:order-2">
          <div className="relative mx-auto flex h-[260px] w-[260px] items-center justify-center rounded-full border border-gold/25 bg-gradient-to-b from-surface2 to-surface p-9 drop-shadow-[0_25px_40px_rgba(156,122,46,0.25)] md:h-[380px] md:w-[380px] md:p-12">
            <div className="relative h-full w-full">
              <Image src="/images/logo.png" alt={t.brandName} fill className="object-contain" sizes="380px" priority />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
