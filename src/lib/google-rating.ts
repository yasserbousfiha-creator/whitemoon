import type { Branch } from "./content";

// Each branch's rating on Google Maps, copied by hand from its Maps page (no API). null = not filled in yet: the badge
// stays hidden rather than showing a made-up number. Update when the numbers move noticeably.
export const GOOGLE_RATINGS: Record<Branch["id"], { rating: number; count: number } | null> = {
  khamseen: null,
  shahar: null,
  wisam: null,
};

/** One branch's rating, or (home page) all branches together, weighted by their review counts. */
export function googleRating(branch: Branch["id"] | null) {
  if (branch) return GOOGLE_RATINGS[branch];
  const all = Object.values(GOOGLE_RATINGS).filter((r): r is { rating: number; count: number } => !!r);
  const count = all.reduce((s, r) => s + r.count, 0);
  if (!count) return null;
  return { rating: Math.round((all.reduce((s, r) => s + r.rating * r.count, 0) / count) * 10) / 10, count };
}
