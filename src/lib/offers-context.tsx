"use client";

import { createContext, useContext } from "react";
import { useBranch } from "./branch-context";
import { type Offer, isLive, offerIn } from "./offers";

// The live offers, read from the database on the server (HomePage) and handed to the page's client components.
const OffersContext = createContext<Offer[]>([]);

export const OffersProvider = OffersContext.Provider;

// The offers for the current page (a branch page: that branch's), checked again for expiry here since a
// prerendered page can outlive an offer's last day.
export function useOffers() {
  const offers = useContext(OffersContext);
  const branch = useBranch();
  return offers.filter((o) => isLive(o) && offerIn(o, branch));
}

export function useOffer(id: number | null | undefined) {
  const offers = useContext(OffersContext);
  return id ? (offers.find((o) => o.id === id) ?? null) : null;
}
