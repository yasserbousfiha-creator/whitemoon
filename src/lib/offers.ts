// Offers (the `offers` table, supabase/011_offers.sql), added from /admin → "العروض". lib/offers-server.ts reads
// them; these helpers are pure so the site, the booking API and /admin share them.
import type { BranchId, ServiceId } from "./booking-labels";

export interface Offer {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string | null; // the offer's design, as posted on social media
  priceBefore: number | null;
  priceAfter: number | null;
  branches: BranchId[]; // empty = every branch
  service: ServiceId; // the department the "book this offer" button picks
  endsOn: string | null; // "YYYY-MM-DD", last day included (Riyadh)
  sortOrder: number;
  active: boolean;
}

export interface OfferRow {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image: string | null;
  price_before: number | string | null; // numeric comes back as a string
  price_after: number | string | null;
  branches: BranchId[] | null;
  service: ServiceId;
  ends_on: string | null;
  sort_order: number;
  active: boolean;
}

const num = (v: number | string | null) => (v === null || v === "" ? null : Number(v));

export const offerFromRow = (r: OfferRow): Offer => ({
  id: r.id,
  titleAr: r.title_ar,
  titleEn: r.title_en,
  descriptionAr: r.description_ar,
  descriptionEn: r.description_en,
  image: r.image,
  priceBefore: num(r.price_before),
  priceAfter: num(r.price_after),
  branches: r.branches ?? [],
  service: r.service,
  endsOn: r.ends_on,
  sortOrder: r.sort_order,
  active: r.active,
});

export const riyadhToday = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Shown and bookable: visible, and not past its last day.
export const isLive = (o: Offer, today = riyadhToday()) => o.active && (!o.endsOn || o.endsOn >= today);

// Whether the offer applies at a branch; null (the home page) = every offer.
export const offerIn = (o: Offer, branch: BranchId | null) =>
  branch === null || o.branches.length === 0 || o.branches.includes(branch);

// The title in the page's language (the Arabic one when no English title was written).
export const offerTitle = (o: Offer, isArabic: boolean) => (isArabic || !o.titleEn ? o.titleAr : o.titleEn);
export const offerDescription = (o: Offer, isArabic: boolean) =>
  isArabic || !o.descriptionEn ? o.descriptionAr : o.descriptionEn;
