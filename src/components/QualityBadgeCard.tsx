import { QualityBadge } from "@/lib/content";
import { badgeIconMap } from "./icon-map";

export default function QualityBadgeCard({ badge }: { badge: QualityBadge }) {
  const Icon = badgeIconMap[badge.icon];
  return (
    <div className="rounded-[10px] border border-line/25 bg-surface p-4">
      <Icon size={22} className="text-gold" />
      <p className="mt-2.5 text-[14.5px] font-bold text-ink">{badge.title}</p>
      <p className="mt-1 text-[12.5px] text-ink-soft">{badge.subtitle}</p>
    </div>
  );
}
