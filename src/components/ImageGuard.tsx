"use client";

import { useEffect } from "react";

// Blocks the right-click / long-press menu and dragging on images, the usual ways to save them. It can't stop
// screenshots, and anyone determined can still reach the files, but it removes the one-click "Save image".
export default function ImageGuard() {
  useEffect(() => {
    const block = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);
  return null;
}
