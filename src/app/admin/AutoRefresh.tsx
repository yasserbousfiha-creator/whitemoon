"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-fetches the dashboard every minute while the tab is visible, so new bookings appear without reloading.
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
