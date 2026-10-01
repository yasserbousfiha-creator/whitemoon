"use client";

import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryItem } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";

// A video shows its still with a play button and only loads once tapped, then plays in place.
function VideoTile({ item }: { item: GalleryItem }) {
  const [playing, setPlaying] = useState(false);
  return playing ? (
    <video src={item.src} poster={item.poster} controls autoPlay playsInline className="h-full w-full object-cover" />
  ) : (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={item.caption}
      className="group relative block h-full w-full"
      style={{ backgroundImage: `url(${item.poster})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
      <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold-bright/90 shadow-lg transition-transform group-hover:scale-110">
        <Play size={28} className="translate-x-0.5 fill-night2 text-night2" />
      </span>
      <Caption text={item.caption} />
    </button>
  );
}

function Caption({ text }: { text?: string }) {
  return text ? (
    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-start text-sm font-bold text-white">
      {text}
    </span>
  ) : null;
}

// Clinic videos and photos (tours, before/after cases). Photos open enlarged; videos play in their tile.
export default function GalleryCard() {
  const { t } = useLocale();
  const [open, setOpen] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (t.gallery.length === 0) return null;
  const single = t.gallery.length === 1;

  return (
    <div
      id="gallery"
      className="scroll-anchor rounded-2xl border border-line/25 bg-surface p-6 shadow-[0_18px_40px_-20px_rgba(156,122,46,0.35)]"
    >
      <div className="border-b border-line/20 pb-4">
        <span className="text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
          {t.galleryLabel}
        </span>
      </div>

      <div>
        <div className="mt-5 flex flex-wrap justify-center gap-4">
          {t.gallery.map((item) => (
            <div
              key={item.src}
              className={`relative aspect-[9/16] overflow-hidden rounded-2xl border border-line/25 bg-night2 shadow-[0_18px_40px_-20px_rgba(156,122,46,0.35)] ${
                single ? "w-full max-w-[300px]" : "w-[calc(50%-8px)] max-w-[260px]"
              }`}
            >
              {item.kind === "video" ? (
                <VideoTile item={item} />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(item)}
                  aria-label={item.caption}
                  className="block h-full w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- gallery photos are plain files of any size */}
                  <img src={item.src} alt={item.caption ?? ""} className="h-full w-full object-cover" loading="lazy" />
                  <Caption text={item.caption} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Portalled to <body> so the animated section wrapper can't trap this fixed overlay. */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4"
          >
            <button
              type="button"
              aria-label="إغلاق"
              className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white"
            >
              <X size={22} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img
              src={open.src}
              alt={open.caption ?? ""}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
            {open.caption && <p className="mt-3 text-center text-sm font-bold text-white">{open.caption}</p>}
          </div>,
          document.body,
        )}
    </div>
  );
}
