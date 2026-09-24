"use client";

import { Phone } from "lucide-react";
import { siInstagram, siTiktok, siSnapchat, siWhatsapp } from "simple-icons";
import { Content } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";

const brands = [
  { icon: siInstagram, href: (t: Content) => t.instagramUrl, bg: "#E4405F", fg: "#fff" },
  { icon: siTiktok, href: (t: Content) => t.tiktokUrl, bg: "#000", fg: "#fff" },
  { icon: siSnapchat, href: (t: Content) => t.snapchatUrl, bg: "#FFFC00", fg: "#000" },
  { icon: siWhatsapp, href: (t: Content) => t.whatsappUrl, bg: "#25D366", fg: "#fff" },
];

export default function TopUtilityBar() {
  const { t, locale, toggleLocale } = useLocale();

  return (
    <div className="border-b border-line/20 bg-surface2">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between px-6 py-2">
        <div className="hidden items-center gap-5 md:flex">
          <a
            href={`tel:${t.phone}`}
            dir="ltr"
            className="flex items-center gap-1.5 text-[12.5px] text-ink-soft hover:text-ink"
          >
            <Phone size={13} />
            {t.phoneDisplay}
          </a>
          <span className="text-[12.5px] text-ink-soft">{t.mapPinTitle}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {brands.map(({ icon, href, bg, fg }) => (
            <a
              key={icon.title}
              href={href(t)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={icon.title}
              style={{ backgroundColor: bg, color: fg }}
              className="grid h-6 w-6 place-items-center rounded-md transition-transform hover:scale-110"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden>
                <path d={icon.path} />
              </svg>
            </a>
          ))}

          <div className="ms-2 flex items-center gap-0.5 rounded-full border border-line/30 px-1 py-0.5">
            <button
              type="button"
              onClick={toggleLocale}
              className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${
                locale === "ar" ? "bg-gold-bright text-night2" : "text-ink-soft"
              }`}
            >
              AR
            </button>
            <button
              type="button"
              onClick={toggleLocale}
              className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${
                locale === "en" ? "bg-gold-bright text-night2" : "text-ink-soft"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
