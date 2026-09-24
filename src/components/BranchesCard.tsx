"use client";

import { Clock, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function BranchesCard() {
  const { t } = useLocale();

  return (
    <div className="rounded-2xl border border-line/25 bg-surface p-6 shadow-[0_18px_40px_-20px_rgba(156,122,46,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/20 pb-4">
        <span className="text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
          {t.branchesLabel}
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-gold">
          <Clock size={14} />
          {t.workingHoursValue}
        </span>
      </div>

      <div className="divide-y divide-line/15">
        {t.branches.map((b) => (
          <div key={b.name} className="flex items-start gap-3.5 py-4 last:pb-0">
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] bg-surface2">
              <MapPin size={18} className="text-gold" />
            </span>
            <span>
              <span className="block text-[14.5px] font-bold text-ink">{b.name}</span>
              <span className="mt-0.5 block text-[13px] text-ink-soft">{b.address}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
