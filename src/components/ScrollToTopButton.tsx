"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

// How long the arrow lingers after scrolling stops.
const HIDE_AFTER_MS = 1200;

// Bottom-centre, translucent arrow that only shows while the visitor is scrolling (past the first screen),
// and fades away once they stop. Stays while hovered so it can be clicked.
export default function ScrollToTopButton() {
  const [scrolling, setScrolling] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      setScrolling(window.scrollY > 480);
      clearTimeout(timer);
      timer = setTimeout(() => setScrolling(false), HIDE_AFTER_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  const visible = scrolling || hovered;
  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed bottom-5 left-1/2 z-40 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-gold/30 bg-surface/50 text-gold shadow-md backdrop-blur-sm transition-all duration-300 ease-out hover:bg-surface/90 ${
        visible ? "pointer-events-auto translate-y-0 opacity-70 hover:opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ChevronUp size={22} />
    </button>
  );
}
