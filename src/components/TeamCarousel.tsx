"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CircleUserRound } from "lucide-react";
import { TeamMember } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";

export default function TeamCarousel({ team }: { team: TeamMember[] }) {
  const { t, isArabic } = useLocale();
  const [index, setIndex] = useState(0);

  if (team.length === 0) return null;

  const member = team[index];
  const go = (delta: number) => setIndex((prev) => (prev + delta + team.length) % team.length);

  const PrevIcon = isArabic ? ChevronRight : ChevronLeft;
  const NextIcon = isArabic ? ChevronLeft : ChevronRight;

  return (
    <div className="rounded-[12px] border border-line/25 bg-surface2 p-4">
      <p className="text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
        {t.teamLabel}
      </p>

      <div className="mt-3 flex items-center justify-center gap-4">
        {team.length > 1 && (
          <button
            type="button"
            aria-label="previous"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line/30 bg-surface text-ink-soft hover:text-ink"
          >
            <PrevIcon size={16} />
          </button>
        )}

        <div className="flex flex-col items-center gap-2">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/25 bg-surface">
            <CircleUserRound size={34} className="text-gold/70" strokeWidth={1.5} />
          </span>
          <span className="text-[13px] font-bold text-ink">{member.role}</span>
        </div>

        {team.length > 1 && (
          <button
            type="button"
            aria-label="next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line/30 bg-surface text-ink-soft hover:text-ink"
          >
            <NextIcon size={16} />
          </button>
        )}
      </div>

      {team.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {team.map((m, i) => (
            <span key={m.role} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-gold" : "bg-line/40"}`} />
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-ink-soft">{t.teamPhotoNote}</p>
    </div>
  );
}
