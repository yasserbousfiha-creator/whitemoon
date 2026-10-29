"use client";

import { Star } from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { googleRating } from "@/lib/google-rating";
import { useLocale } from "@/lib/locale-context";

// "★★★★★ 4.9 · 320 reviews on Google" — this branch's, or every branch's on the home page. Hidden until the real
// numbers are filled in (lib/google-rating.ts).
export default function GoogleRatingBadge({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const r = googleRating(useBranch());
  if (!r) return null;
  const full = Math.round(r.rating);
  return (
    <div className={`inline-flex items-center gap-2.5 rounded-full border border-gold-bright/40 bg-surface/80 px-4 py-2 shadow-sm ${className}`}>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={15} className={i < full ? "fill-gold-bright text-gold-bright" : "text-gold-bright/40"} />
        ))}
      </span>
      <span className="text-[14px] font-bold text-ink" dir="ltr">
        {r.rating.toFixed(1)}
      </span>
      <span className="text-[12.5px] text-ink-soft">
        {locale === "ar" ? `${r.count.toLocaleString("ar-SA")} تقييم على Google` : `${r.count.toLocaleString("en")} Google reviews`}
      </span>
    </div>
  );
}
