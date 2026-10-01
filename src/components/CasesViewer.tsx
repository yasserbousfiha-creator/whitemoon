"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Full-screen before/after photos, one per screen, swiped sideways (snaps to each photo). Follows the page
// direction, so in Arabic the first photo is on the right and the next ones come from the left.
export default function CasesViewer({
  title,
  photos,
  empty,
  onClose,
}: {
  title: string;
  photos: string[];
  empty: string; // shown while a doctor has no case photos yet
  onClose: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // scrollLeft is negative in right-to-left pages, hence the abs().
  const onScroll = () => {
    const el = strip.current;
    if (el) setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };
  const go = (to: number) => {
    const el = strip.current;
    if (el)
      el.children[Math.max(0, Math.min(photos.length - 1, to))]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
  };

  // Portalled to <body>: the doctors section sits inside an animated (transformed) wrapper, which would otherwise
  // pin this "fixed" overlay to that section instead of the screen, under the sticky header.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-bold">
          {title}
          {photos.length > 0 && ` · ${index + 1}/${photos.length}`}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/15 hover:bg-white/25"
        >
          <X size={22} />
        </button>
      </div>

      {photos.length === 0 && (
        <div className="grid flex-1 place-items-center p-6">
          <p className="max-w-xs text-center text-[15px] leading-relaxed text-white/85">{empty}</p>
        </div>
      )}

      <div className={`relative min-h-0 flex-1 ${photos.length === 0 ? "hidden" : ""}`}>
        <div
          ref={strip}
          onScroll={onScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none]"
        >
          {photos.map((src, i) => (
            <div key={src} className="grid h-full w-full shrink-0 snap-start place-items-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- full-size photo, sized by the viewport */}
              <img src={src} alt={`${title} ${i + 1}`} className="max-h-full max-w-full rounded-xl object-contain" />
            </div>
          ))}
        </div>

        {/* Arrows for mouse users; on phones the photos are swiped. Start = previous, end = next in either direction. */}
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="السابق"
          className="absolute start-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30 md:grid"
        >
          <ChevronRight size={24} className="ltr:rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === photos.length - 1}
          aria-label="التالي"
          className="absolute end-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-30 md:grid"
        >
          <ChevronLeft size={24} className="ltr:rotate-180" />
        </button>
      </div>

      <div className="flex justify-center gap-2 py-4">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => go(i)}
            aria-label={`${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-gold-bright" : "w-2 bg-white/40"}`}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
