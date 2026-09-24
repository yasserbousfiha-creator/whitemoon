import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SpecialtyHighlights from "@/components/SpecialtyHighlights";
import Intro from "@/components/Intro";
import Services from "@/components/Services";
import Journey from "@/components/Journey";
import Booking from "@/components/Booking";
import Contest from "@/components/Contest";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import WhatsappFab from "@/components/WhatsappFab";

export default function Home() {
  return (
    <>
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
          <Journey />
        </RevealOnScroll>
        <RevealOnScroll>
          <Booking />
        </RevealOnScroll>
        <RevealOnScroll>
          <Contest />
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

      <div className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-3">
        <ScrollToTopButton />
        <WhatsappFab />
      </div>
    </>
  );
}
