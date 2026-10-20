import { Quote } from "lucide-react";
import { Locale, Testimonial } from "@/lib/content";

// "6 months ago" from the month a Google review was posted, so it stays right as time passes.
function postedAgo(date: string, locale: Locale) {
  const [y, m] = date.split("-").map(Number);
  const now = new Date();
  const months = now.getFullYear() * 12 + now.getMonth() + 1 - (y * 12 + m);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return months >= 12 ? rtf.format(-Math.floor(months / 12), "year") : rtf.format(-Math.max(months, 0), "month");
}

export default function TestimonialCard({ testimonial, locale }: { testimonial: Testimonial; locale: Locale }) {
  return (
    <div className="rounded-[14px] border border-line/25 bg-surface p-[22px]">
      <Quote size={26} className="text-gold-bright" />
      <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink-soft italic">{testimonial.quote}</p>
      <p className="mt-[18px] text-[14px] font-bold text-ink" dir="auto">
        {testimonial.name}
      </p>
      <p className="mt-0.5 text-[12px] text-gold">{testimonial.role}</p>
      <p className="mt-1 text-[11.5px] text-ink-soft">
        {locale === "ar" ? "تقييم على Google" : "Google review"} · {postedAgo(testimonial.date, locale)}
      </p>
    </div>
  );
}
