"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/lib/locale-context";
import { riyadhToday } from "@/lib/offers";
import { useOffers } from "@/lib/offers-context";
import OfferCard from "./OfferCard";

const APPEAR_AFTER_MS = 2500;
const SEEN_KEY = "wm:offer-popup"; // "<offer id>:<day>"

// On branch pages: the first offer (the newest unless reordered in /admin) pops up once a day per visitor. The home
// page skips it, since the branch picker opens there.
export default function OfferPopup() {
  const { t } = useLocale();
  const offers = useOffers();
  const offer = offers[0] ?? null;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!offer) return;
    const mark = `${offer.id}:${riyadhToday()}`;
    try {
      if (localStorage.getItem(SEEN_KEY) === mark) return;
    } catch {
      // Storage blocked (private mode…): still show it, just without remembering.
    }
    const id = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(SEEN_KEY, mark);
      } catch {}
    }, APPEAR_AFTER_MS);
    return () => clearTimeout(id);
  }, [offer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !offer) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.offers.popupLabel}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      className="branch-picker fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-night2/55 p-4 backdrop-blur-sm"
    >
      <div className={`branch-picker-card relative w-full max-w-[400px] ${offer.image ? "md:max-w-[780px]" : ""}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-gold-bright px-3 py-1 text-[12px] font-bold text-night2">{t.offers.popupLabel}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.offers.close}
            className="grid h-9 w-9 place-items-center rounded-full bg-bg text-ink shadow"
          >
            <X size={20} />
          </button>
        </div>
        <div className="rounded-2xl shadow-[0_30px_80px_-20px_rgba(14,11,7,0.55)]">
          <OfferCard offer={offer} onBook={() => setOpen(false)} popup />
        </div>
        {offers.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-3 w-full text-center text-[14px] font-bold text-white underline"
          >
            {t.offers.viewAll} ({offers.length})
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
