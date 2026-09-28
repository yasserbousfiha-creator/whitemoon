"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, UserRound, X } from "lucide-react";
import AccountPanel from "./AccountPanel";
import { useLocale } from "@/lib/locale-context";
import TopUtilityBar from "./TopUtilityBar";

function scrollToSection(id: string) {
  // "Home" goes to the very top; the section's scroll margin would otherwise leave a gap above it.
  if (id === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Header() {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      <TopUtilityBar />

      <header className="sticky top-0 z-50 border-b border-transparent bg-bg/92 backdrop-blur">
        <div className="mx-auto flex max-w-[1160px] items-center px-6 py-3">
          <button type="button" onClick={() => scrollToSection("home")} className="flex items-center gap-3">
            <span className="relative h-11 w-11 shrink-0">
              <Image src="/images/logo.png" alt={t.brandName} fill className="object-contain" sizes="44px" />
            </span>
            <span className="text-start">
              <span className="block font-display text-[19px] text-ink">{t.brandName}</span>
              <span className="block text-[10.5px] tracking-wide text-ink-soft">{t.brandTagline}</span>
            </span>
          </button>

          <div className="flex-1" />

          <nav className="hidden items-center gap-6 md:flex">
            {t.navItems.map((item) => (
              <button
                key={item.sectionId}
                type="button"
                onClick={() => scrollToSection(item.sectionId)}
                className="text-[14.5px] font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="rounded-full border border-gold-bright px-5 py-2 text-[14px] font-semibold text-ink transition-colors hover:bg-surface2"
            >
              {t.ctaCall}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("booking")}
              className="rounded-full bg-gold-bright px-5 py-2 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.03]"
            >
              {t.ctaBookNow}
            </button>
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label={t.account.title}
              title={t.account.title}
              className="grid h-10 w-10 place-items-center rounded-full border border-line/40 text-ink transition-colors hover:bg-surface2"
            >
              <UserRound size={19} />
            </button>
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <button type="button" aria-label={t.account.title} onClick={() => setAccountOpen(true)} className="text-ink">
              <UserRound size={24} />
            </button>
            <button type="button" aria-label="Menu" onClick={() => setMenuOpen(true)} className="text-ink">
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      <AccountPanel open={accountOpen} onClose={() => setAccountOpen(false)} />

      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-night/60"
          />
          <div className="absolute inset-y-0 end-0 flex w-[82%] max-w-sm flex-col bg-bg p-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-[22px] text-ink">{t.brandName}</span>
              <button type="button" aria-label="Close" onClick={() => setMenuOpen(false)} className="text-ink">
                <X size={24} />
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-1">
              {t.navItems.map((item) => (
                <button
                  key={item.sectionId}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    scrollToSection(item.sectionId);
                  }}
                  className="py-2.5 text-start text-[17px] font-semibold text-ink"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                scrollToSection("booking");
              }}
              className="mt-6 rounded-full bg-gold-bright px-5 py-3 text-[14px] font-semibold text-night2"
            >
              {t.ctaBookNow}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
