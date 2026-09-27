"use client";

import { FormEvent, useState } from "react";
import { Gift } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { PRIZES, type PrizeId, SLICES, prizeLabel } from "@/lib/wheel";
import Eyebrow from "./Eyebrow";

type Phase = "idle" | "spinning" | "done" | "invalid" | "error";
interface Result {
  prize: PrizeId;
  code: string;
  validUntil: string;
  alreadySpun: boolean;
}

const SIZE = 300;
const R = SIZE / 2;
const SLICE_DEG = 360 / SLICES.length;
const COLORS: Record<PrizeId, { fill: string; text: string }> = {
  prosthetics15: { fill: "#c9a24b", text: "#0e0b07" },
  free_consult: { fill: "#211c14", text: "#e8c877" },
  ortho10: { fill: "#f3ecda", text: "#211c14" },
};

// Point on the rim at `deg` degrees clockwise from 12 o'clock.
const rim = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180;
  return [R + r * Math.sin(a), R - r * Math.cos(a)] as const;
};

function Wheel({ rotation, spinning, onStop }: { rotation: number; spinning: boolean; onStop: () => void }) {
  const { locale } = useLocale();
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Pointer at 12 o'clock */}
      <div className="absolute start-1/2 top-[-6px] z-10 -translate-x-1/2 rtl:translate-x-1/2">
        <div className="h-0 w-0 border-x-[13px] border-t-[22px] border-x-transparent border-t-night2 drop-shadow" />
      </div>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full drop-shadow-[0_18px_30px_rgba(156,122,46,0.35)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 5s cubic-bezier(0.15, 0.7, 0.1, 1)" : "none",
        }}
        onTransitionEnd={onStop}
        aria-hidden
      >
        {SLICES.map((id, i) => {
          const start = i * SLICE_DEG;
          const [x1, y1] = rim(start);
          const [x2, y2] = rim(start + SLICE_DEG);
          const mid = start + SLICE_DEG / 2;
          const [tx, ty] = rim(mid, R * 0.62);
          const prize = PRIZES.find((p) => p.id === id)!;
          const lines = locale === "ar" ? prize.shortAr : prize.shortEn;
          return (
            <g key={i}>
              <path d={`M${R},${R} L${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2} Z`} fill={COLORS[id].fill} stroke="#fbf7ee" strokeWidth={2} />
              <text
                x={tx}
                y={ty}
                transform={`rotate(${mid} ${tx} ${ty})`}
                textAnchor="middle"
                fill={COLORS[id].text}
                className="font-display"
                fontSize={15}
                fontWeight={700}
              >
                <tspan x={tx} dy={-4}>
                  {lines[0]}
                </tspan>
                <tspan x={tx} dy={18} fontSize={12.5}>
                  {lines[1]}
                </tspan>
              </text>
            </g>
          );
        })}
        <circle cx={R} cy={R} r={R - 1} fill="none" stroke="#c9a24b" strokeWidth={3} />
        <circle cx={R} cy={R} r={26} fill="#fbf7ee" stroke="#c9a24b" strokeWidth={3} />
        <text x={R} y={R + 6} textAnchor="middle" fontSize={16} fill="#9c7a2e">
          ☾
        </text>
      </svg>
    </div>
  );
}

// Monthly lucky wheel. The server draws the prize and allows one spin per phone number per month.
export default function LuckyWheel() {
  const { t, locale } = useLocale();
  const w = t.wheel;
  const [phase, setPhase] = useState<Phase>("idle");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setPhase("spinning");
    setResult(null);
    try {
      const res = await fetch("/api/wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, phone: data.phone }),
      });
      if (!res.ok) {
        setPhase(res.status === 400 ? "invalid" : "error");
        return;
      }
      const r: Result = await res.json();
      setResult(r);
      // Land a random one of this prize's slices under the pointer, a little off-centre so it looks natural.
      const candidates = SLICES.flatMap((id, i) => (id === r.prize ? [i] : []));
      const slice = candidates[Math.floor(Math.random() * candidates.length)];
      const jitter = (Math.random() - 0.5) * SLICE_DEG * 0.6;
      const target = 360 - (slice * SLICE_DEG + SLICE_DEG / 2) + jitter;
      setRotation((prev) => prev - (prev % 360) + 360 * (r.alreadySpun ? 1 : 6) + target);
    } catch {
      setPhase("error");
    }
  }

  const spinning = phase === "spinning";
  const validUntil = result
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(
        new Date(`${result.validUntil}T00:00:00Z`),
      )
    : "";

  return (
    <section id="wheel" className="scroll-anchor bg-surface2">
      <div className="mx-auto grid max-w-[900px] items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-16">
        <div>
          <Eyebrow text={w.eyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{w.heading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{w.intro}</p>

          {phase === "done" && result ? (
            <div className="mt-6 rounded-2xl border border-gold-bright/60 bg-surface p-6 shadow-[0_18px_40px_-20px_rgba(156,122,46,0.35)]">
              <Gift size={26} className="text-gold" />
              <p className="mt-3 text-[13px] text-ink-soft">{result.alreadySpun ? w.already : w.won}</p>
              <p className="mt-1 font-display text-[21px] font-bold text-ink">{prizeLabel(result.prize, locale)}</p>
              <p className="mt-4 text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
                {w.code}
              </p>
              <p dir="ltr" className="mt-1 text-start font-mono text-[22px] font-bold tracking-widest text-gold">
                {result.code}
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">
                {w.validUntil} {validUntil}. {w.showCode}
              </p>
              <a
                href="#booking"
                className="mt-4 inline-block rounded-full bg-gold-bright px-6 py-2.5 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02]"
              >
                {w.book}
              </a>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-line/25 bg-surface p-5">
              <label className="text-[13px] font-bold text-ink-soft">
                {w.name}
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-[10px] border border-line/40 bg-bg px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-gold-bright"
                />
              </label>
              <label className="text-[13px] font-bold text-ink-soft">
                {w.phone}
                <input
                  name="phone"
                  type="tel"
                  required
                  dir="ltr"
                  autoComplete="tel"
                  className="mt-1.5 w-full rounded-[10px] border border-line/40 bg-bg px-3.5 py-2.5 text-start text-[15px] text-ink outline-none focus:border-gold-bright"
                />
              </label>
              <button
                type="submit"
                disabled={spinning}
                className="rounded-full bg-gold-bright px-6 py-3 text-[14px] font-semibold text-night2 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {spinning ? w.spinning : w.spin}
              </button>
              {phase === "invalid" && <p className="text-[13.5px] text-red-600">{w.invalid}</p>}
              {phase === "error" && <p className="text-[13.5px] text-red-600">{w.error}</p>}
            </form>
          )}
          <p className="mt-3 text-[12px] text-ink-soft">{w.terms}</p>
        </div>

        <Wheel rotation={rotation} spinning={spinning} onStop={() => spinning && setPhase("done")} />
      </div>
    </section>
  );
}
