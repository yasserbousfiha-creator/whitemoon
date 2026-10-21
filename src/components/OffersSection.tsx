"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { useOffers } from "@/lib/offers-context";
import Eyebrow from "./Eyebrow";
import OfferCard from "./OfferCard";

// The live offers (added from /admin → "العروض"), side by side. Phones swipe the row; computers get side arrows and
// can drag it with the mouse (a hidden scrollbar left them only the keyboard). A branch page shows only that branch's;
// with no offers the section is left out.
export default function OffersSection() {
  const { t, isArabic } = useLocale();
  const offers = useOffers();
  const row = useRef<HTMLDivElement>(null);
  // How far the row can still go back (toward the first offer) and forward.
  const [edges, setEdges] = useState({ back: false, forward: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  // scrollLeft is 0 at the first offer and grows negative in right-to-left pages.
  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const done = Math.abs(el.scrollLeft);
    // A little slack: snapping to the first card leaves the row a few pixels in (its side padding).
    setEdges({ back: done > 40, forward: done < el.scrollWidth - el.clientWidth - 40 });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, offers.length]);

  // One screenful of cards per press, the next offers lying to the left in Arabic.
  const page = (forward: boolean) => {
    const el = row.current;
    if (!el) return;
    const dir = (forward ? 1 : -1) * (isArabic ? -1 : 1);
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (offers.length === 0) return null;
  const arrow =
    "absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line/30 bg-surface text-ink shadow-lg transition hover:border-gold-bright disabled:pointer-events-none disabled:opacity-0 md:grid";

  return (
    <section id="offers" className="scroll-anchor bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="max-w-[620px]">
          <Eyebrow text={t.offers.eyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.offers.heading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{t.offers.intro}</p>
        </div>

        <div className="relative mt-8">
          <button
            type="button"
            onClick={() => page(false)}
            disabled={!edges.back}
            aria-label={isArabic ? "العروض السابقة" : "Previous offers"}
            className={`${arrow} ${isArabic ? "-right-5" : "-left-5"}`}
          >
            {isArabic ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          </button>
          <button
            type="button"
            onClick={() => page(true)}
            disabled={!edges.forward}
            aria-label={isArabic ? "العروض التالية" : "Next offers"}
            className={`${arrow} ${isArabic ? "-left-5" : "-right-5"}`}
          >
            {isArabic ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
          </button>

          {/* Bleeds to the screen edge on phones so the next card peeks in, hinting that the row scrolls. Mouse drag:
              snapping is paused while dragging, and the click that ends a drag doesn't press a card's button. */}
          <div
            ref={row}
            onScroll={measure}
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse" || e.button !== 0 || !row.current) return;
              drag.current = { x: e.clientX, left: row.current.scrollLeft, moved: false };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !row.current) return;
              const dx = e.clientX - d.x;
              if (!d.moved && Math.abs(dx) < 6) return;
              if (!d.moved) {
                d.moved = true;
                setDragging(true);
                row.current.setPointerCapture(e.pointerId);
              }
              row.current.scrollLeft = d.left - dx;
            }}
            onPointerUp={() => {
              setDragging(false);
              // Cleared after the click event that follows this pointerup.
              setTimeout(() => (drag.current = null));
            }}
            onClickCapture={(e) => {
              if (drag.current?.moved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDragStart={(e) => e.preventDefault()}
            className={`-mx-6 flex items-stretch gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:gap-5 ${
              dragging ? "cursor-grabbing select-none" : "snap-x snap-mandatory md:cursor-grab"
            }`}
          >
            {offers.map((o) => (
              // Phone: one card and a peek of the next; then 3, 4 and 5 across, so the tall designs stay a moderate size.
              <div
                key={o.id}
                className="w-[60%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3.75rem)/4)] lg:w-[calc((100%-5rem)/5)]"
              >
                <OfferCard offer={o} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
