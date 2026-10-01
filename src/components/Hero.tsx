"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Hero() {
  const { t } = useLocale();
  const branchId = useBranch();
  const branch = t.branches.find((b) => b.id === branchId);

  return (
    <section id="home" className="scroll-anchor relative overflow-hidden bg-bg">
      <div className="relative mx-auto flex max-w-[1160px] flex-col items-center gap-10 px-6 py-14 md:flex-row md:py-[76px]">
        <div className="order-2 flex-[6] md:order-1">
          {branch && (
            <div className="rise-in mb-4 flex flex-wrap items-center gap-2" style={{ animationDelay: "0.4s" }}>
              <span className="flex items-center gap-1.5 rounded-full border border-gold-bright/60 bg-surface px-3.5 py-1.5 text-[13px] font-bold text-ink">
                <MapPin size={14} className="text-gold" />
                {branch.name}
              </span>
              <Link href="/" className="text-[12.5px] font-bold text-gold underline-offset-4 hover:underline">
                {t.branchPicker.change}
              </Link>
            </div>
          )}
          <div className="rise-in" style={{ animationDelay: "0.55s" }}>
            <Eyebrow text={t.heroEyebrow} />
          </div>
          <h1
            className="rise-in mt-[18px] font-display text-[32px] leading-[1.28] text-ink md:text-[46px]"
            style={{ animationDelay: "0.75s" }}
          >
            {t.heroHeadline}
          </h1>
          <p
            className="rise-in mt-5 max-w-[480px] text-[16px] leading-relaxed text-ink-soft"
            style={{ animationDelay: "0.95s" }}
          >
            {t.heroLede}
          </p>

          <div className="rise-in mt-7 flex flex-wrap gap-3.5" style={{ animationDelay: "1.15s" }}>
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
          {/* Entrance on the outer box, hover lift/glow on the inner one, so the two transforms don't fight. */}
          <div className="logo-sweep-in mx-auto h-[260px] w-[260px] md:h-[380px] md:w-[380px]">
            <div className="logo-hover relative h-full w-full">
              <span aria-hidden className="logo-halo" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-gold/25 bg-gradient-to-b from-surface2 to-surface p-9 drop-shadow-[0_25px_40px_rgba(156,122,46,0.25)] md:p-12">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/logo.png"
                    alt={t.brandName}
                    fill
                    className="object-contain"
                    sizes="380px"
                    priority
                  />
                </div>
                <span aria-hidden className="logo-shine" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
