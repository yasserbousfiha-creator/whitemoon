"use client";

import { useId, useRef } from "react";
import { type SimpleIcon, siInstagram, siSnapchat, siTiktok, siWhatsapp } from "simple-icons";
import type { Content } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";
import { useInView } from "@/lib/use-in-view";

// Each brand in its own colours, as people know it: a round badge with the glyph inside.
const brands: { icon: SimpleIcon; href: (t: Content) => string; bg: string; glyph: string; outline?: string }[] = [
  { icon: siInstagram, href: (t) => t.instagramUrl, bg: "instagram", glyph: "#ffffff" },
  { icon: siTiktok, href: (t) => t.tiktokUrl, bg: "#000000", glyph: "#ffffff" },
  { icon: siSnapchat, href: (t) => t.snapchatUrl, bg: "#FFFC00", glyph: "#ffffff", outline: "#000000" },
  { icon: siWhatsapp, href: (t) => t.whatsappUrl, bg: "#25D366", glyph: "#ffffff" },
];

/**
 * The clinic's social accounts as coloured round icons; `size` is the badge's width in pixels. With `pop`, the icons
 * swell past their size and settle, one after another, the first time they scroll into view (.social-pop).
 */
export default function SocialIcons({ size, className = "", pop = false }: { size: number; className?: string; pop?: boolean }) {
  const { t } = useLocale();
  const gradient = useId(); // Instagram's gradient, unique per copy on the page
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <div
      ref={ref}
      data-revealed={(pop && inView) || undefined}
      className={`flex items-center gap-2 ${pop ? "social-pop" : ""} ${className}`}
    >
      {brands.map(({ icon, href, bg, glyph, outline }) => (
        <a
          key={icon.title}
          href={href(t)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={icon.title}
          className="shrink-0 transition-transform hover:scale-110"
        >
          <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
            {bg === "instagram" && (
              <defs>
                <radialGradient id={gradient} cx="30%" cy="107%" r="150%">
                  <stop offset="0" stopColor="#fdf497" />
                  <stop offset="0.05" stopColor="#fdf497" />
                  <stop offset="0.45" stopColor="#fd5949" />
                  <stop offset="0.6" stopColor="#d6249f" />
                  <stop offset="0.9" stopColor="#285AEB" />
                </radialGradient>
              </defs>
            )}
            <circle cx="16" cy="16" r="16" fill={bg === "instagram" ? `url(#${gradient})` : bg} />
            <path
              d={icon.path}
              transform="translate(7 7) scale(0.75)"
              fill={glyph}
              stroke={outline}
              strokeWidth={outline ? 1.4 : undefined}
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ))}
    </div>
  );
}
