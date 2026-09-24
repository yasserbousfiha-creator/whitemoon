"use client";

import { useLocale } from "@/lib/locale-context";
import Eyebrow from "./Eyebrow";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  const { t } = useLocale();

  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-[1160px] px-6 py-12 md:py-16">
        <Eyebrow text={t.testimonialsEyebrow} />
        <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{t.testimonialsHeading}</h2>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {t.testimonials.map((item) => (
            <TestimonialCard key={item.name} testimonial={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
