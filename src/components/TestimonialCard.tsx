import { Quote } from "lucide-react";
import { Testimonial } from "@/lib/content";

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-[14px] border border-line/25 bg-surface p-[22px]">
      <Quote size={26} className="text-gold-bright" />
      <p className="mt-3.5 text-[14.5px] leading-relaxed text-ink-soft italic">{testimonial.quote}</p>
      <p className="mt-[18px] text-[14px] font-bold text-ink">{testimonial.name}</p>
      <p className="mt-0.5 text-[12px] text-gold">{testimonial.role}</p>
    </div>
  );
}
