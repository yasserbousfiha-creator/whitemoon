"use client";

import Image from "next/image";
import type { Device } from "@/lib/content";
import { useLocale } from "@/lib/locale-context";

// The clinic's equipment for a service, in place of the team list (laser & skin).
export default function DevicesGrid({ devices }: { devices: Device[] }) {
  const { t } = useLocale();
  return (
    <div className="rounded-[12px] border border-line/25 bg-surface2 p-4">
      <p className="text-[10.5px] font-bold text-ink-soft" style={{ letterSpacing: "1px" }}>
        {t.devicesLabel}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {devices.map((d) => (
          <div key={d.name} className="flex flex-col items-center gap-1.5 text-center">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line/25 bg-white">
              <Image src={d.photo} alt={d.name} fill sizes="120px" className="object-cover" />
            </div>
            <span dir="ltr" className="text-[12.5px] font-bold leading-tight text-ink">
              {d.name}
            </span>
            <span className="text-[11px] leading-snug text-ink-soft">{d.use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
