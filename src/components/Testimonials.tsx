"use client";

import { inBranch, useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import GoogleRatingBadge from "./GoogleRatingBadge";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  const { t, locale } = useLocale();
  const branch = useBranch();
  // This branch's Google reviews; the home page shows every branch's.
  const shown = t.testimonials.filter((r) => inBranch(branch, r.branch));
  // Many reviews glide past slowly (pausing under a finger or the mouse); a branch's three stay a still grid.
  const glide = shown.length > 3;

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow text={t.testimonialsEyebrow} />
            <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.testimonialsHeading}</h2>
          </div>
          <GoogleRatingBadge />
        </div>

        {!glide && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {shown.map((item) => (
              <TestimonialCard key={item.name} testimonial={item} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {glide && (
        <div className="marquee relative -mt-4 overflow-hidden pb-12 md:pb-16">
          {/* Soft fade at both edges. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bg to-transparent md:w-24" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bg to-transparent md:w-24" />
          <div className={`marquee-track flex w-max items-stretch ${locale === "ar" ? "marquee-rtl" : "marquee-ltr"}`}>
            {/* The list twice, so the loop has no seam (each copy ends with the same gap); the copy is hidden from screen readers. */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-stretch gap-4 pe-4 md:gap-5 md:pe-5" aria-hidden={copy === 1 || undefined}>
                {shown.map((item) => (
                  <div key={item.name} className="w-[300px] shrink-0 md:w-[360px] [&>div]:h-full">
                    <TestimonialCard testimonial={item} locale={locale} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
