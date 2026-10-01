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
import BranchPicker from "@/components/BranchPicker";
import type { Branch } from "@/lib/content";
import { BranchProvider } from "@/lib/branch-context";

// The whole site. A branch page (/khamseen…) shows only that branch's doctors, devices and location; the home
// page shows everything behind the branch picker.
export default function HomePage({ branch, picker = false }: { branch: Branch["id"] | null; picker?: boolean }) {
  return (
    <BranchProvider value={branch}>
      <Header />

      <main>
        <Hero />
        <RevealOnScroll>
          <SpecialtyHighlights />
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
        <RevealOnScroll>
          <LuckyWheel />
        </RevealOnScroll>
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

      <ScrollToTopButton />
      <div className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-3">
        <WhatsappFab />
      </div>

      {picker && <BranchPicker />}
    </BranchProvider>
  );
}
