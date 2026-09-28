import { JourneyPhase } from "@/lib/content";
import StepGlyph from "./StepGlyph";

// Lifts with a soft card and zooms its glyph on hover.
export default function JourneyPhaseCard({ phase }: { phase: JourneyPhase }) {
  return (
    <div className="group relative -m-3 rounded-2xl p-3 transition duration-300 ease-out hover:-translate-y-2 hover:bg-surface hover:shadow-[0_18px_36px_-18px_rgba(156,122,46,0.45)]">
      <div className="transition-transform duration-300 ease-out group-hover:scale-110 ltr:origin-left rtl:origin-right">
        <StepGlyph icon={phase.icon} />
      </div>
      <p className="mt-3.5 font-display text-[22px] text-gold/70 transition-colors duration-300 group-hover:text-gold">
        {phase.step}
      </p>
      <p className="mt-1 text-[15.5px] font-bold text-ink">{phase.name}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{phase.desc}</p>
    </div>
  );
}
