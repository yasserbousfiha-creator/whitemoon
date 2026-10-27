"use client";

import { useRef } from "react";
import { useInView } from "@/lib/use-in-view";

/**
 * Fades and slides its child up into place the first time it scrolls into
 * view, instead of showing all page content immediately on load.
 */
export default function RevealOnScroll({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useInView(ref);

  return (
    <div
      ref={ref}
      className={`${className ?? ""} transition-all duration-700 ease-out ${
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * A row or grid whose items slide in from the left one after another the first time it scrolls into view
 * (the `.stagger-in` rules in globals.css).
 */
export function StaggerIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useInView(ref);

  return (
    <div ref={ref} className={`stagger-in ${className ?? ""}`} data-revealed={revealed || undefined}>
      {children}
    </div>
  );
}
