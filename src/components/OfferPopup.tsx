"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import { useOffers } from "@/lib/offers-context";
import OfferCard from "./OfferCard";

const APPEAR_AFTER_MS = 800;
const SEEN_KEY = "wm:offers-popup:"; // + branch id, in sessionStorage

// On branch pages: right after a branch is picked, all of its offers pop up in a carousel (swipe, or the side arrows
// and dots). Once per visit to each branch; the home page skips it, since the branch picker opens there.
export default function OfferPopup() {
  const { t, isArabic } = useLocale();
  const branch = useBranch();
  const offers = useOffers();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (offers.length === 0) return;
    const key = SEEN_KEY + (branch ?? "all");
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // Storage blocked (private mode…): still show it, just without remembering.
    }
    const id = setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
    }, APPEAR_AFTER_MS);
    return () => clearTimeout(id);
  }, [offers.length, branch]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const goTo = useCallback((i: number) => {
    const slide = track.current?.children[i] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  // The slide in view, from the scroll position (scrollLeft is negative in right-to-left pages).
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };

  if (!open || offers.length === 0) return null;
  const many = offers.length > 1;
  const wide = offers.some((o) => o.image);
  // In Arabic the next offer is to the left.
  const arrow = "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bg/90 text-ink shadow-lg disabled:opacity-30";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.offers.popupLabel}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      className="branch-picker fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-night2/55 p-4 backdrop-blur-sm"
    >
      <div className={`branch-picker-card relative w-full max-w-[400px] ${wide ? "md:max-w-[780px]" : ""}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-gold-bright px-3 py-1 text-[12px] font-bold text-night2">
            {t.offers.popupLabel}
            {many && ` · ${index + 1} / ${offers.length}`}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.offers.close}
            className="grid h-9 w-9 place-items-center rounded-full bg-bg text-ink shadow"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative">
          <div
            ref={track}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory items-start overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {offers.map((o) => (
              <div key={o.id} className="w-full shrink-0 snap-center">
                <div className="rounded-2xl shadow-[0_30px_80px_-20px_rgba(14,11,7,0.55)]">
                  <OfferCard offer={o} onBook={() => setOpen(false)} popup />
                </div>
              </div>
            ))}
          </div>
          {many && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label={isArabic ? "العرض السابق" : "Previous offer"}
                className={`${arrow} ${isArabic ? "-right-3" : "-left-3"}`}
              >
                {isArabic ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === offers.length - 1}
                aria-label={isArabic ? "العرض التالي" : "Next offer"}
                className={`${arrow} ${isArabic ? "-left-3" : "-right-3"}`}
              >
                {isArabic ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
              </button>
            </>
          )}
        </div>

        {many && (
          <div className="mt-3 flex justify-center gap-1.5">
            {offers.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-gold-bright" : "w-2 bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
