"use client";

import { CalendarCheck, MapPin, MessageCircle, Phone } from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import { openBranchPicker } from "./BranchPicker";

// Phones only: book · WhatsApp · call · location, always at hand at the bottom of the screen. The numbers follow the
// branch being shown (useLocale swaps them); on the home page "location" opens the branch picker instead.
export default function MobileActionBar() {
  const { t } = useLocale();
  const branchId = useBranch();
  const branch = t.branches.find((b) => b.id === branchId);
  const m = t.mobileBar;
  const item = "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11.5px] font-bold text-ink-soft transition-colors active:text-gold";

  return (
    <nav
      aria-label={m.book}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-bright/30 bg-bg/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(14,11,7,0.45)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-[520px] items-stretch px-2">
        <a href={`tel:${t.phone}`} className={item}>
          <Phone size={20} strokeWidth={1.8} className="text-gold" />
          {m.call}
        </a>
        <a href={t.whatsappUrl} target="_blank" rel="noopener noreferrer" className={item}>
          <MessageCircle size={20} strokeWidth={1.8} className="text-gold" />
          {m.whatsapp}
        </a>
        <button
          type="button"
          // counted by SiteTracker (data-track), like the WhatsApp link
          data-track="book_click"
          onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })}
          className="mx-1 my-1.5 flex flex-[1.25] flex-col items-center justify-center gap-0.5 rounded-2xl bg-gold-bright text-[12px] font-bold text-night2 shadow-[0_6px_18px_-6px_rgba(201,162,75,0.8)] active:scale-[0.97]"
        >
          <CalendarCheck size={21} strokeWidth={2} />
          {m.book}
        </button>
        {branch ? (
          <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer" className={item}>
            <MapPin size={20} strokeWidth={1.8} className="text-gold" />
            {m.map}
          </a>
        ) : (
          <button type="button" onClick={openBranchPicker} className={item}>
            <MapPin size={20} strokeWidth={1.8} className="text-gold" />
            {m.branches}
          </button>
        )}
      </div>
    </nav>
  );
}
