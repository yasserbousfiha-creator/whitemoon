import { JourneyPhase } from "@/lib/content";
import StepGlyph from "./StepGlyph";

export default function JourneyPhaseCard({ phase }: { phase: JourneyPhase }) {
  return (
    <div>
      <StepGlyph icon={phase.icon} />
      <p className="mt-3.5 font-display text-[22px] text-gold/70">{phase.step}</p>
      <p className="mt-1 text-[15.5px] font-bold text-ink">{phase.name}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{phase.desc}</p>
    </div>
  );
}
