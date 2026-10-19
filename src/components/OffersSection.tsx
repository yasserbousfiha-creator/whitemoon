"use client";

import { useLocale } from "@/lib/locale-context";
import { useOffers } from "@/lib/offers-context";
import Eyebrow from "./Eyebrow";
import OfferCard from "./OfferCard";

// The live offers (added from /admin → "العروض"), side by side and swiped sideways on phones. A branch page shows
// only that branch's; with no offers the section is left out.
export default function OffersSection() {
  const { t } = useLocale();
  const offers = useOffers();
  if (offers.length === 0) return null;

  return (
    <section id="offers" className="scroll-anchor bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="max-w-[620px]">
          <Eyebrow text={t.offers.eyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.offers.heading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{t.offers.intro}</p>
        </div>

        {/* Bleeds to the screen edge on phones so the next card peeks in, hinting that the row scrolls. */}
        <div className="-mx-6 mt-8 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:gap-5">
          {offers.map((o) => (
            <div key={o.id} className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-[calc((100%-2.5rem)/3)]">
              <OfferCard offer={o} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
