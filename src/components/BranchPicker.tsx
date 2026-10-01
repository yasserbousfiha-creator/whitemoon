"use client";

import { MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/lib/locale-context";

// Shown on the home page once the logo and opening lines have played: the three branches side by side, and
// picking one opens that branch's page. Appears on every visit; the X keeps browsing the general page.
const APPEAR_AFTER_MS = 2200;

export default function BranchPicker() {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), APPEAR_AFTER_MS);
    t.branches.forEach((b) => router.prefetch(`/${b.id}`));
    return () => clearTimeout(id);
  }, [router, t.branches]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.branchPicker.title}
      className="branch-picker fixed inset-0 z-[100] grid place-items-center bg-night2/55 p-4 backdrop-blur-sm"
    >
      <div className="branch-picker-card relative w-full max-w-[720px] rounded-3xl border border-gold-bright/40 bg-bg p-6 shadow-[0_30px_80px_-20px_rgba(14,11,7,0.55)] md:p-9">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.branchPicker.close}
          className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface2 hover:text-ink"
        >
          <X size={20} />
        </button>

        <p className="text-center text-[11px] font-bold tracking-[2px] text-gold">{t.brandName}</p>
        <h2 className="mt-2 text-center font-display text-[22px] text-ink md:text-[28px]">{t.branchPicker.title}</h2>
        <p className="mt-2 text-center text-[13.5px] text-ink-soft">{t.branchPicker.subtitle}</p>

        <div className="mt-6 grid grid-cols-3 gap-2.5 md:gap-4">
          {t.branches.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => router.push(`/${b.id}`)}
              className="branch-picker-option group flex flex-col items-center gap-2.5 rounded-2xl border border-line/30 bg-surface px-2 py-5 text-center shadow-[0_14px_30px_-20px_rgba(156,122,46,0.5)] transition duration-300 hover:-translate-y-1 hover:border-gold-bright hover:shadow-[0_20px_40px_-18px_rgba(156,122,46,0.6)] md:px-4 md:py-7"
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-surface2 transition-colors group-hover:bg-gold-bright md:h-14 md:w-14">
                <MapPin size={22} className="text-gold transition-colors group-hover:text-night2" />
              </span>
              <span className="font-display text-[15px] leading-tight text-ink md:text-[18px]">{b.name}</span>
              <span className="hidden text-[12px] leading-snug text-ink-soft md:block">{b.address}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
