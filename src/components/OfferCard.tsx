"use client";

import { CalendarCheck, Clock, MapPin } from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { prefillBooking } from "@/lib/booking-prefill";
import { useLocale } from "@/lib/locale-context";
import { type Offer, offerDescription, offerTitle } from "@/lib/offers";

// "Book this offer": fills in the booking form with the offer's department and, when it is clear, its branch.
export function bookOffer(o: Offer, pageBranch: Offer["branches"][number] | null) {
  const branch = pageBranch ?? (o.branches.length === 1 ? o.branches[0] : undefined);
  prefillBooking({ service: o.service, branch, offerId: o.id });
}

// One offer: its design (as posted on social media), title, prices, branches, last day and the booking button.
// Used by the offers section and the popup. In the popup it must fit the screen without scrolling: the design is
// capped in height on phones and sits beside the details on larger screens.
export default function OfferCard({ offer: o, onBook, popup = false }: { offer: Offer; onBook?: () => void; popup?: boolean }) {
  const { t, isArabic, locale } = useLocale();
  const pageBranch = useBranch();
  const s = t.offers;
  const price = (n: number) => `${n.toLocaleString(isArabic ? "ar-SA-u-nu-latn" : "en-US")} ${s.currency}`;
  const until = o.endsOn
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${o.endsOn}T00:00:00Z`))
    : null;
  const description = offerDescription(o, isArabic);

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-line/25 bg-surface ${popup ? "md:flex-row" : ""}`}
    >
      {o.image && (
        // eslint-disable-next-line @next/next/no-img-element -- designs of any shape, shown whole
        <img
          src={o.image}
          alt={offerTitle(o, isArabic)}
          className={
            popup
              ? "max-h-[64svh] w-full bg-surface2 object-contain md:max-h-[80svh] md:w-[58%] md:self-center"
              : "h-auto w-full bg-surface2"
          }
          loading={popup ? "eager" : "lazy"}
        />
      )}
      <div className={`flex flex-1 flex-col gap-2 p-4 ${popup ? "md:justify-center md:p-6" : ""}`}>
        <h3 className={`font-display leading-snug text-ink ${popup ? "text-[18px]" : "text-[16px]"}`}>{offerTitle(o, isArabic)}</h3>
        {/* The design carries the details: the popup leaves the list out (the design gets the room), the offers
            section shows its first lines under the smaller cards. */}
        {description && !(popup && o.image) && (
          <p
            className={`whitespace-pre-line leading-relaxed text-ink-soft ${popup ? "text-[14px]" : "text-[13px]"} ${o.image && !popup ? "line-clamp-3" : ""}`}
          >
            {description}
          </p>
        )}
        {(o.priceAfter !== null || o.priceBefore !== null) && (
          <p className="flex items-baseline gap-2">
            {o.priceAfter !== null && <span className="text-[20px] font-bold text-gold">{price(o.priceAfter)}</span>}
            {o.priceBefore !== null && <s className="text-[14px] text-ink-soft">{price(o.priceBefore)}</s>}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-soft">
          {/* A branch page already says which branch it is. */}
          {!pageBranch && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {o.branches.length === 0
                ? s.allBranches
                : o.branches.map((id) => t.branches.find((b) => b.id === id)?.name).join(isArabic ? "، " : ", ")}
            </span>
          )}
          {until && (
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {s.endsOn.replace("{date}", until)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onBook?.();
            bookOffer(o, pageBranch);
          }}
          className={`${popup ? "mt-3" : "mt-auto"} flex items-center justify-center gap-1.5 rounded-full bg-gold-bright px-5 py-2.5 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02]`}
        >
          <CalendarCheck size={16} />
          {s.book}
        </button>
      </div>
    </article>
  );
}
