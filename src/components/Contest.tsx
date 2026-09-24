"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { CONTEST_EVENT, ContestWinner, daysLeftInMonth, drawWinner, getState } from "@/lib/contest";
import Eyebrow from "./Eyebrow";

export default function Contest() {
  const { t } = useLocale();
  const c = t.contest;
  const [count, setCount] = useState(0);
  const [winner, setWinner] = useState<ContestWinner | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const s = getState();
      setCount(s.entries.length);
      setWinner(s.winner);
      setDays(daysLeftInMonth());
    };
    refresh();
    window.addEventListener(CONTEST_EVENT, refresh);
    return () => window.removeEventListener(CONTEST_EVENT, refresh);
  }, []);

  return (
    <section id="contest" className="scroll-anchor bg-surface2">
      <div className="mx-auto max-w-[900px] px-6 py-12 md:py-16">
        <Eyebrow text={c.eyebrow} />
        <h2 className="mt-2.5 font-display text-[24px] text-ink md:text-[30px]">{c.heading}</h2>
        <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-ink-soft">{c.intro}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gold-bright/50 bg-surface p-6 shadow-[0_18px_40px_-20px_rgba(156,122,46,0.35)]">
            <Gift size={26} className="text-gold" />
            <p className="mt-3 text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
              {c.prizeLabel}
            </p>
            <p className="mt-1 font-display text-[19px] font-bold text-ink">{c.prize}</p>
          </div>
          <div className="rounded-2xl border border-line/25 bg-surface p-6">
            <p className="font-display text-[34px] font-bold text-gold">{days ?? "–"}</p>
            <p className="mt-1 text-[13px] text-ink-soft">{c.daysLeft}</p>
          </div>
          <div className="rounded-2xl border border-line/25 bg-surface p-6">
            <p className="font-display text-[34px] font-bold text-gold">{count}</p>
            <p className="mt-1 text-[13px] text-ink-soft">{c.participants}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-line/25 bg-surface p-6">
          <p className="text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
            {c.winnerLabel}
          </p>
          <p className="mt-1.5 text-[16px] font-bold text-ink">
            {winner ? (
              <>
                {winner.name} · <span dir="ltr">{winner.phone}</span>
              </>
            ) : (
              c.noWinner
            )}
          </p>
          <button
            type="button"
            onClick={() => setEmpty(drawWinner() === null)}
            className="mt-4 rounded-full border border-line/40 px-5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface2"
          >
            {c.drawButton}
          </button>
          {empty && count === 0 && <p className="mt-3 text-[13px] text-ink-soft">{c.noEntries}</p>}
        </div>

        <p className="mt-4 text-[12px] text-ink-soft">{c.demoNote}</p>
      </div>
    </section>
  );
}
