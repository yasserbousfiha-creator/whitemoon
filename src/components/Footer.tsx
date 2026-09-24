"use client";

import Image from "next/image";
import { useLocale } from "@/lib/locale-context";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-ink" style={{ letterSpacing: "1.2px" }}>
        {title}
      </p>
      <div className="mt-3.5 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({
  onClick,
  href,
  children,
  ltr = false,
}: {
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  ltr?: boolean;
}) {
  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        dir={ltr ? "ltr" : undefined}
        className="w-fit text-[13.5px] text-ink-soft hover:text-ink"
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-fit text-start text-[13.5px] text-ink-soft hover:text-ink">
      {children}
    </button>
  );
}

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-surface2">
      <div className="mx-auto max-w-[1160px] px-6 pt-12 pb-[34px]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[3fr_2fr_2fr_2fr]">
          <div className="max-w-[280px]">
            <div className="flex items-center gap-3">
              <span className="relative h-[42px] w-[42px] shrink-0">
                <Image src="/images/logo.png" alt={t.brandName} fill className="object-contain" sizes="42px" />
              </span>
              <span className="font-display text-[17px] text-ink">{t.brandName}</span>
            </div>
            <p className="mt-4 text-[13.5px] text-ink-soft">{t.footerDesc}</p>
          </div>

          <FooterCol title={t.footerSite}>
            {t.navItems.map((item) => (
              <FooterLink key={item.sectionId} onClick={() => scrollToSection(item.sectionId)}>
                {item.label}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title={t.footerSpecialties}>
            {t.services.map((s) => (
              <FooterLink key={s.title} onClick={() => scrollToSection("services")}>
                {s.title}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title={t.footerContact}>
            <FooterLink href={`tel:${t.phone}`} ltr>
              {t.phoneDisplay}
            </FooterLink>
            <FooterLink href={t.whatsappUrl}>{t.navContact === "Contact" ? "WhatsApp" : "واتساب"}</FooterLink>
            <FooterLink href={t.instagramUrl}>Instagram</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-8 h-px bg-line/25" />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12.5px] text-ink-soft">{t.footerCopyright}</p>
          <p className="text-[12.5px] text-ink-soft">{t.footerPreview}</p>
        </div>
      </div>
    </footer>
  );
}
