import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { type Offer, type OfferRow, offerFromRow } from "./offers";
import { createServiceClient } from "./supabase";

// Reads the `offers` table (supabase/011_offers.sql). The site's pages are prerendered with the live offers and
// rebuilt when /admin changes one (app/admin/offer-actions.ts revalidates OFFERS_TAG).
export const OFFERS_TAG = "offers";

// Live offers, in display order. Row level security only exposes visible, unexpired ones. Unlike the doctors, a
// failure (or the table not created yet) shows no offers rather than failing the page.
export const getOffers = unstable_cache(
  async (): Promise<Offer[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return [];
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from("offers")
      .select("*")
      .order("sort_order")
      .order("id", { ascending: false })
      .returns<OfferRow[]>();
    if (error) {
      console.error("Offers lookup failed:", error);
      return [];
    }
    return data.map(offerFromRow);
  },
  ["offers", "v2"],
  { tags: [OFFERS_TAG], revalidate: 300 },
);

// Every offer including hidden and expired ones, uncached, for the /admin editor (needs the server key).
export async function getAllOffers(): Promise<{ offers: Offer[]; error: string | null }> {
  const db = createServiceClient();
  if (!db) return { offers: [], error: "config" };
  const { data, error } = await db
    .from("offers")
    .select("*")
    .order("sort_order")
    .order("id", { ascending: false })
    .returns<OfferRow[]>();
  if (error) {
    console.error("Offers lookup failed:", error);
    return { offers: [], error: error.code ?? error.message };
  }
  return { offers: data.map(offerFromRow), error: null };
}
