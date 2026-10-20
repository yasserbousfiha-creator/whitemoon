"use client";

import { useEffect } from "react";
import { useBranch } from "@/lib/branch-context";
import { track, trackOnce } from "@/lib/track";

// Counts a visit (once per session), the branch page opened (once per session per branch), and clicks on WhatsApp
// links and booking buttons (data-track="book_click" or a "#booking" link; prefillBooking counts its own).
export default function SiteTracker() {
  const branch = useBranch();

  useEffect(() => {
    trackOnce("visit", "visit");
  }, []);

  useEffect(() => {
    if (branch) trackOnce("branch", `branch:${branch}`);
  }, [branch]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest("a, button");
      if (!el) return;
      const href = el.getAttribute("href") ?? "";
      if (/wa\.me|wa\.link|whatsapp/i.test(href)) track("whatsapp");
      else if (href === "#booking" || el.getAttribute("data-track") === "book_click") track("book_click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
