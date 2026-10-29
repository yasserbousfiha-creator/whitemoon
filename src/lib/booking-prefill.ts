import type { ServiceId } from "./booking-labels";
import type { Branch } from "./content";
import { track } from "./track";

// Lets any section (a doctor in the team carousel, a service card…) fill in the booking form and scroll to it.
export const PREFILL_EVENT = "wm:booking-prefill";

export interface BookingPrefill {
  service?: ServiceId;
  branch?: Branch["id"];
  doctor?: string;
  doctorId?: string;
  offerId?: number; // booking from an offer (lib/offers.ts)
}

export function prefillBooking(detail: BookingPrefill) {
  track("book_click");
  window.dispatchEvent(new CustomEvent<BookingPrefill>(PREFILL_EVENT, { detail }));
  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
}
