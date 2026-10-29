import { JourneyPhase } from "@/lib/content";
import StepGlyph from "./StepGlyph";

// On the journey's night band: lifts with a faint gold-lit card and zooms its glyph on hover.
export default function JourneyPhaseCard({ phase }: { phase: JourneyPhase }) {
  return (
    <div className="group relative -m-3 rounded-2xl p-3 transition duration-300 ease-out hover:-translate-y-2 hover:bg-white/[0.04] hover:shadow-[0_18px_40px_-20px_rgba(232,200,119,0.35)]">
      <div className="transition-transform duration-300 ease-out group-hover:scale-110 ltr:origin-left rtl:origin-right">
        <StepGlyph icon={phase.icon} onNight />
      </div>
      <p className="mt-3.5 font-display text-[26px] text-gold-bright/85 transition-colors duration-300 group-hover:text-gold-glow">
        {phase.step}
      </p>
      <p className="mt-1 text-[15.5px] font-bold text-bg">{phase.name}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-bg/60">{phase.desc}</p>
    </div>
  );
}
