"use client";

import { Phone, Camera, Music2, MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

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

        <div className="flex items-center gap-1">
          <a href={t.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-1 text-ink-soft hover:text-gold">
            <Camera size={15} />
          </a>
          <a href={t.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-1 text-ink-soft hover:text-gold">
            <Music2 size={15} />
          </a>
          <a href={t.snapchatUrl} target="_blank" rel="noopener noreferrer" aria-label="Snapchat" className="p-1 text-ink-soft hover:text-gold">
            <MessageCircle size={15} />
          </a>

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
