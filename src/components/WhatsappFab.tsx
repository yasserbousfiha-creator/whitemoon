"use client";

import { MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function WhatsappFab() {
  const { t } = useLocale();
  return (
    <a
      href={t.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="grid h-14 w-14 place-items-center rounded-full bg-gold-bright text-night2 shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle size={24} />
    </a>
  );
}
