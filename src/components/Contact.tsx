"use client";

import { MapPin, Phone, LayoutGrid, MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import BranchesCard from "./BranchesCard";
import Eyebrow from "./Eyebrow";

function IconPlate({ icon: Icon }: { icon: typeof MapPin }) {
  return (
    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] border border-line/25 bg-surface">
      <Icon size={18} className="text-gold" />
    </span>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  ltr = false,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
  ltr?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3.5">
      <IconPlate icon={icon} />
      <span>
        <span className="block text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
          {label}
        </span>
        <span className="mt-0.5 block text-[15px] text-ink" dir={ltr ? "ltr" : undefined}>
          {value}
        </span>
      </span>
    </div>
  );

  return href ? (
    <a href={href} className="mb-[18px] block">
      {content}
    </a>
  ) : (
    <div className="mb-[18px]">{content}</div>
  );
}

export default function Contact() {
  const { t } = useLocale();

  return (
    <section id="contact" className="scroll-anchor bg-surface2">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-8 px-6 py-[52px] md:flex-row md:py-[70px]">
        <div className="flex-1">
          <Eyebrow text={t.contactEyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.contactHeading}</h2>

          <div className="mt-[26px] mb-[18px]">
            <BranchesCard />
          </div>

          <div>
            <ContactRow icon={Phone} label={t.phoneLabel} value={t.phoneDisplay} href={`tel:${t.phone}`} ltr />
            <ContactRow icon={LayoutGrid} label={t.followLabel} value={t.followValue} />
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={t.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.03]"
            >
              <MessageCircle size={18} />
              {t.ctaMessageWhatsApp}
            </a>
            <a
              href={`tel:${t.phone}`}
              className="rounded-full border border-line/40 px-6 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              {t.ctaCallNow}
            </a>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border border-line/25 bg-surface p-5 text-center">
            <MapPin size={30} className="text-gold" />
            <p className="mt-2.5 font-display text-[18px] text-ink">{t.mapPinTitle}</p>
            <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-ink-soft">{t.mapPinNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
