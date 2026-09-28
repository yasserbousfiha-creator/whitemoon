"use client";

import Image from "next/image";
import { useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, CircleUserRound } from "lucide-react";
import { prefillBooking } from "@/lib/booking-prefill";
import { ServiceContent, TeamMember } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";

export default function TeamCarousel({ team, service }: { team: TeamMember[]; service: ServiceContent["icon"] }) {
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
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name ?? member.role}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border-2 border-gold-bright/60 object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/25 bg-surface">
              <CircleUserRound size={34} className="text-gold/70" strokeWidth={1.5} />
            </span>
          )}
          <span className="text-center">
            {member.name && <span className="block text-[14px] font-bold text-ink">{member.name}</span>}
            <span className={member.name ? "block text-[12px] text-ink-soft" : "text-[13px] font-bold text-ink"}>{member.role}</span>
          </span>
          {member.name && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prefillBooking({ service, branch: member.branch, doctor: member.name, doctorId: member.id });
              }}
              className="mt-1 flex items-center gap-1.5 rounded-full border border-gold-bright/60 bg-surface px-3.5 py-1.5 text-[12.5px] font-bold text-gold transition-colors hover:bg-gold-bright hover:text-night2"
            >
              <CalendarCheck size={14} />
              {t.booking.bookWith} {member.name}
            </button>
          )}
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
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-gold" : "bg-line/40"}`} />
          ))}
        </div>
      )}

      {team.some((m) => !m.photo) && <p className="mt-3 text-center text-[11px] text-ink-soft">{t.teamPhotoNote}</p>}
    </div>
  );
}
