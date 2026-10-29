import type { BranchId, ServiceId } from "./booking-labels";
import type { Content } from "./content";

// The departments offered in the booking form: the site's service cards, except that «الليزر وتنظيف البشرة» is booked
// as two (user's choice 2026-10-29): laser, and skin cleansing ("skincare").

export interface BookingService {
  id: ServiceId;
  title: string;
  branches?: BranchId[];
}

export function bookingServices(t: Content): BookingService[] {
  return t.services.flatMap((s): BookingService[] =>
    s.icon === "laser"
      ? [
          { id: "laser", title: t.booking.serviceLaser, branches: s.branches },
          { id: "skincare", title: t.booking.serviceSkincare, branches: s.branches },
        ]
      : [{ id: s.icon, title: s.title, branches: s.branches }],
  );
}

/** Booked without a doctor, day or time — like an offer, the clinic calls the patient (user's choice 2026-10-29). */
export const CALL_ONLY_SERVICES: ServiceId[] = ["laser"];
export const isCallOnly = (service: string | null | undefined) => !!service && (CALL_ONLY_SERVICES as string[]).includes(service);
