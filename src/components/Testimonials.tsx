"use client";

import { inBranch, useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  const { t, locale } = useLocale();
  const branch = useBranch();
  // This branch's Google reviews; the home page shows every branch's.
  const shown = t.testimonials.filter((r) => inBranch(branch, r.branch));

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <Eyebrow text={t.testimonialsEyebrow} />
        <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.testimonialsHeading}</h2>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {shown.map((item) => (
            <TestimonialCard key={item.name} testimonial={item} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
