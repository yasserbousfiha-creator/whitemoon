"use client";

import { useLocale } from "@/lib/locale-context";

export default function Eyebrow({ text, onNight = false }: { text: string; onNight?: boolean }) {
  const { isArabic } = useLocale();
  return (
    <p
      className={`text-[12.5px] font-bold ${onNight ? "text-gold-glow" : "text-gold"}`}
      style={{ letterSpacing: isArabic ? "0.5px" : "2.2px" }}
    >
      {text}
    </p>
  );
}
