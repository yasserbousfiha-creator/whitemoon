import { PhoneCall, CalendarCheck, ClipboardCheck, Sparkles } from "lucide-react";
import { JourneyIcon } from "@/lib/content";

const iconMap: Record<JourneyIcon, typeof PhoneCall> = {
  reachOut: PhoneCall,
  book: CalendarCheck,
  diagnose: ClipboardCheck,
  result: Sparkles,
};

/** onNight: the journey's dark band — a dark disc with a gold ring and a soft glow. */
export default function StepGlyph({ icon, onNight = false }: { icon: JourneyIcon; onNight?: boolean }) {
  const Icon = iconMap[icon];
  return (
    <span
      className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border ${
        onNight ? "border-gold-bright/50 bg-night shadow-[0_0_26px_-6px_rgba(232,200,119,0.45)]" : "border-gold/30 bg-surface"
      }`}
    >
      <Icon size={22} className={onNight ? "text-gold-glow" : "text-gold"} strokeWidth={1.75} />
    </span>
  );
}
