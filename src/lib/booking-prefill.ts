import type { Branch, ServiceContent } from "./content";
import type { DoctorId } from "./doctors";

// Lets any section (a doctor in the team carousel, a service card…) fill in the booking form and scroll to it.
export const PREFILL_EVENT = "wm:booking-prefill";

export interface BookingPrefill {
  service?: ServiceContent["icon"];
  branch?: Branch["id"];
  doctor?: string;
  doctorId?: DoctorId;
}

export function prefillBooking(detail: BookingPrefill) {
  window.dispatchEvent(new CustomEvent<BookingPrefill>(PREFILL_EVENT, { detail }));
  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
}
