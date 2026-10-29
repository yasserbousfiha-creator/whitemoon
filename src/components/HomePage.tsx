import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SpecialtyHighlights from "@/components/SpecialtyHighlights";
import Intro from "@/components/Intro";
import Services from "@/components/Services";
import Journey from "@/components/Journey";
import Booking from "@/components/Booking";
import DoctorsSection from "@/components/DoctorsSection";
import LuckyWheel from "@/components/LuckyWheel";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import WhatsappFab from "@/components/WhatsappFab";
import MobileActionBar from "@/components/MobileActionBar";
import ChatAssistant from "@/components/ChatAssistant";
import BranchPicker from "@/components/BranchPicker";
import type { Branch } from "@/lib/content";
import { BranchProvider } from "@/lib/branch-context";
import { DoctorsProvider } from "@/lib/doctors-context";
import { getDoctors } from "@/lib/doctors-server";
import { OffersProvider } from "@/lib/offers-context";
import { getOffers } from "@/lib/offers-server";
import { getWheelSettings } from "@/lib/wheel-server";
import OffersSection from "@/components/OffersSection";
import OfferPopup from "@/components/OfferPopup";
import SiteTracker from "@/components/SiteTracker";
import { structuredData } from "@/lib/structured-data";

// The whole site. A branch page (/khamseen…) shows only that branch's doctors, devices and location; the home
// page shows everything behind the branch picker. The doctors and offers come from the database (edited in /admin).
export default async function HomePage({ branch, picker = false }: { branch: Branch["id"] | null; picker?: boolean }) {
  const [doctors, offers, wheel] = await Promise.all([getDoctors(), getOffers(), getWheelSettings()]);
  return (
    <BranchProvider value={branch}>
      <DoctorsProvider value={doctors}>
      <OffersProvider value={offers}>
        <SiteTracker />
        {/* For Google (search and Maps): the clinic and its branches — lib/structured-data.ts */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(branch) }} />
        <Header />

        <main>
          <Hero />
          <RevealOnScroll>
            <SpecialtyHighlights />
          </RevealOnScroll>
          <RevealOnScroll>
            <OffersSection />
          </RevealOnScroll>
          <RevealOnScroll>
            <Intro />
          </RevealOnScroll>
          <RevealOnScroll>
            <Services />
          </RevealOnScroll>
          <RevealOnScroll>
            <DoctorsSection />
          </RevealOnScroll>
          <RevealOnScroll>
            <Journey />
          </RevealOnScroll>
          <RevealOnScroll>
            <Booking />
          </RevealOnScroll>
          {/* Hidden from /admin (جوائز العجلة) when the clinic pauses it. */}
          {wheel.enabled && (
            <RevealOnScroll>
              <LuckyWheel prizes={wheel.prizes} />
            </RevealOnScroll>
          )}
          <RevealOnScroll>
            <Testimonials />
          </RevealOnScroll>
          <RevealOnScroll>
            <About />
          </RevealOnScroll>
          <RevealOnScroll>
            <Contact />
          </RevealOnScroll>
        </main>

        <Footer />
        {/* Phones: room under the footer for the bar below. */}
        <div aria-hidden className="h-[calc(68px+env(safe-area-inset-bottom))] bg-surface2 md:hidden" />

        <ScrollToTopButton />
        {/* On phones the bar carries WhatsApp, so only the assistant floats here, above the bar. */}
        <div className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] end-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:end-6">
          <ChatAssistant />
          <div className="max-md:hidden">
            <WhatsappFab />
          </div>
        </div>
        <MobileActionBar />

        {picker ? <BranchPicker /> : <OfferPopup />}
      </OffersProvider>
      </DoctorsProvider>
    </BranchProvider>
  );
}
