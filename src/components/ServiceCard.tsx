"use client";

import { CalendarCheck } from "lucide-react";
import { prefillBooking } from "@/lib/booking-prefill";
import { ServiceContent } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";
import { useServicesUI } from "@/lib/services-ui-context";
import { serviceIconMap } from "./icon-map";
import TeamCarousel from "./TeamCarousel";

// Whitening shades from bleach white to a soft natural white, shown inside a gold frame.
const shades: [string, string][] = [
  ["#FFFFFF", "BL1"],
  ["#FCFBF8", "BL2"],
  ["#F8F6F0", "BL3"],
  ["#F3F0E8", "A1"],
  ["#EDE9DF", "B1"],
];

function ServiceExtra({ service }: { service: ServiceContent }) {
  if (service.extraType === "shadeGuide") {
    return (
      <div className="flex gap-1 rounded-[10px] bg-gradient-to-b from-gold-glow to-gold-bright p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
        {shades.map(([color, label]) => (
          <div
            key={label}
            className="flex h-[28px] flex-1 items-center justify-center rounded-[6px] text-[9.5px] font-bold text-ink-soft shadow-[inset_0_-2px_4px_rgba(0,0,0,0.06)]"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
        ))}
      </div>
    );
  }

  if (service.extraType === "radianceBar") {
    return (
      <div
        className="h-2.5 rounded-full"
        style={{ background: "linear-gradient(to right, #F3ECDA, #C9A24B, #E8C877)" }}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {service.waveTags?.map((w) => (
        <span key={w} className="rounded-full border border-line/25 px-2.5 py-1 text-[11.5px] font-bold text-gold">
          {w}
        </span>
      ))}
    </div>
  );
}

export default function ServiceCard({ service }: { service: ServiceContent }) {
  const Icon = serviceIconMap[service.icon];
  const { t } = useLocale();
  const { expandedIcon, setExpandedIcon } = useServicesUI();

  const isExpanded = expandedIcon === service.icon;
  const isCompact = expandedIcon !== null && !isExpanded;

  const handleClick = () => {
    if (!window.matchMedia("(hover: none)").matches) return;
    setExpandedIcon(isExpanded ? null : service.icon);
  };
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setExpandedIcon(service.icon);
  };

  if (isCompact) {
    return (
      <div
        onPointerEnter={handlePointerEnter}
        onClick={handleClick}
        className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-line/25 bg-surface px-3 py-8 transition-all duration-500 ease-in-out md:h-full md:basis-[104px] md:grow-0 md:shrink-0"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-surface2">
          <Icon size={22} className="text-gold" />
        </span>
        <span className="text-center text-[13px] font-bold text-ink">{service.title}</span>
      </div>
    );
  }

  return (
    <div
      onPointerEnter={handlePointerEnter}
      onClick={handleClick}
      className={`rounded-[14px] border bg-surface px-6 pt-[26px] pb-6 transition-all duration-500 ease-in-out md:basis-0 md:grow ${
        isExpanded ? "border-gold-bright/50 shadow-[0_20px_45px_-20px_rgba(156,122,46,0.4)]" : "border-line/25"
      }`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-[10px] bg-surface2">
        <Icon size={22} className="text-gold" />
      </div>
      <p className="mt-4 font-display text-[19px] font-bold text-ink">{service.title}</p>
      <ul className="mt-3.5 space-y-2">
        {service.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[14px] text-ink-soft">
            <span className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-gold-bright" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-line/25 pt-4">
        <p className="text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
          {service.extraLabel}
        </p>
        <div className="mt-2.5">
          <ServiceExtra service={service} />
        </div>
      </div>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="text-[13px] leading-relaxed text-ink-soft italic">{service.note}</p>
          <div className="mt-4">
            <TeamCarousel
              key={isExpanded ? `${service.icon}-open` : `${service.icon}-closed`}
              team={service.team}
              service={service.icon}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prefillBooking({ service: service.icon });
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gold-bright px-5 py-2.5 text-[13.5px] font-semibold text-night2 transition-transform hover:scale-[1.02]"
          >
            <CalendarCheck size={16} />
            {t.ctaBookNow}
          </button>
        </div>
      </div>
    </div>
  );
}
