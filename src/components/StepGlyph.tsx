import { PhoneCall, CalendarCheck, ClipboardCheck, Sparkles } from "lucide-react";
import { JourneyIcon } from "@/lib/content";

const iconMap: Record<JourneyIcon, typeof PhoneCall> = {
  reachOut: PhoneCall,
  book: CalendarCheck,
  diagnose: ClipboardCheck,
  result: Sparkles,
};

export default function StepGlyph({ icon }: { icon: JourneyIcon }) {
  const Icon = iconMap[icon];
  return (
    <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/30 bg-surface">
      <Icon size={22} className="text-gold" strokeWidth={1.75} />
    </span>
  );
}
