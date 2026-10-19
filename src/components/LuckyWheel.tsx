"use client";

import { FormEvent, useState } from "react";
import { Gift } from "lucide-react";
import { savePrize } from "@/lib/account";
import { useLocale } from "@/lib/locale-context";
import { type Prize, slicesFor } from "@/lib/wheel";
import Eyebrow from "./Eyebrow";

type Phase = "idle" | "spinning" | "done" | "invalid" | "error";
interface Result {
  prize: string;
  prizeAr: string;
  prizeEn: string;
  code: string;
  validUntil: string;
  alreadySpun: boolean;
}

const SIZE = 300;
const R = SIZE / 2;
// Gold, dark and cream slices, by position; with a slice count that isn't a multiple of three only the first two
// alternate, so neighbouring slices (including the last and the first) never share a colour.
const PALETTE = [
  { fill: "#c9a24b", text: "#0e0b07" },
  { fill: "#211c14", text: "#e8c877" },
  { fill: "#f3ecda", text: "#211c14" },
];
const sliceColor = (i: number, count: number) => PALETTE[count % 3 === 0 || count % 2 === 1 ? i % 3 : i % 2];

// Point on the rim at `deg` degrees clockwise from 12 o'clock.
const rim = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180;
  return [R + r * Math.sin(a), R - r * Math.cos(a)] as const;
};

function Wheel({
  slices,
  rotation,
  spinning,
  onStop,
}: {
  slices: Prize[];
  rotation: number;
  spinning: boolean;
  onStop: () => void;
}) {
  const { locale } = useLocale();
  const sliceDeg = 360 / slices.length;
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
        {slices.map((prize, i) => {
          const start = i * sliceDeg;
          const [x1, y1] = rim(start);
          const [x2, y2] = rim(start + sliceDeg);
          const mid = start + sliceDeg / 2;
          const [tx, ty] = rim(mid, R * 0.62);
          const lines = locale === "ar" ? prize.shortAr : prize.shortEn;
          const color = sliceColor(i, slices.length);
          return (
            <g key={i}>
              <path
                d={`M${R},${R} L${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2} Z`}
                fill={color.fill}
                stroke="#fbf7ee"
                strokeWidth={2}
              />
              <text
                x={tx}
                y={ty}
                transform={`rotate(${mid} ${tx} ${ty})`}
                textAnchor="middle"
                fill={color.text}
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

// Monthly lucky wheel. The server draws the prize and allows one spin per phone number per month. The prizes (and
// whether the wheel shows at all) are set in /admin.
export default function LuckyWheel({ prizes }: { prizes: Prize[] }) {
  const { t, locale } = useLocale();
  const w = t.wheel;
  const slices = slicesFor(prizes);
  const sliceDeg = 360 / slices.length;
  const names = prizes.map((p) => (locale === "ar" ? p.ar : p.en));
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
      // Kept in "My Account" so the code is always at hand.
      savePrize({ code: r.code, prize: r.prize, prizeAr: r.prizeAr, prizeEn: r.prizeEn, validUntil: r.validUntil });
      // This number already used its spin this month: refuse outright instead of spinning again.
      if (r.alreadySpun) {
        setPhase("done");
        return;
      }
      // Land a random one of this prize's slices under the pointer, a little off-centre so it looks natural.
      const candidates = slices.flatMap((p, i) => (p.id === r.prize ? [i] : []));
      // A prize renamed or removed since the page loaded isn't on this wheel: just show the result.
      if (candidates.length === 0) {
        setPhase("done");
        return;
      }
      const slice = candidates[Math.floor(Math.random() * candidates.length)];
      const jitter = (Math.random() - 0.5) * sliceDeg * 0.6;
      const target = 360 - (slice * sliceDeg + sliceDeg / 2) + jitter;
      setRotation((prev) => prev - (prev % 360) + 360 * 6 + target);
    } catch {
      setPhase("error");
    }
  }

  const spinning = phase === "spinning";
  const validUntil = result
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${result.validUntil}T00:00:00Z`))
    : "";

  return (
    <section id="wheel" className="scroll-anchor bg-surface2">
      <div className="mx-auto grid max-w-[900px] items-center gap-10 px-6 py-12 md:grid-cols-2 md:py-16">
        <div>
          <Eyebrow text={w.eyebrow} />
          <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{w.heading}</h2>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
            {w.intro} {names.join(locale === "ar" ? "، " : ", ")}.
          </p>

          {phase === "done" && result ? (
            <div className="mt-6 rounded-2xl border border-gold-bright/60 bg-surface p-6 shadow-[0_18px_40px_-20px_rgba(156,122,46,0.35)]">
              <Gift size={26} className="text-gold" />
              {result.alreadySpun ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13.5px] font-bold text-amber-900">{w.already}</p>
              ) : (
                <p className="mt-3 text-[13px] text-ink-soft">{w.won}</p>
              )}
              <p className="mt-1 font-display text-[21px] font-bold text-ink">{locale === "ar" ? result.prizeAr : result.prizeEn}</p>
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

        <Wheel slices={slices} rotation={rotation} spinning={spinning} onStop={() => spinning && setPhase("done")} />
      </div>
    </section>
  );
}
