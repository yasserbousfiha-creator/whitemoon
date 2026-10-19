"use client";

import Image from "next/image";
import { useBranch } from "@/lib/branch-context";
import { useLocale } from "@/lib/locale-context";
import type { Branch } from "@/lib/content";

// CBAHI accreditation is per facility: only the branches listed here show it.
const ACCREDITED: Branch["id"][] = ["khamseen"];

/** The CBAHI logo with one line of text — under the hero ("hero") and in the footer ("footer"). */
export default function CbahiBadge({ variant }: { variant: "hero" | "footer" }) {
  const { isArabic } = useLocale();
  const branch = useBranch();
  if (!branch || !ACCREDITED.includes(branch)) return null;
  const text = isArabic
    ? "منشأة معتمدة من المركز السعودي لاعتماد المنشآت الصحية (سباهي)"
    : "Accredited by the Saudi Central Board for Accreditation of Healthcare Institutions (CBAHI)";

  if (variant === "footer") {
    return (
      <div className="mt-5 flex items-center gap-3">
        <span className="relative h-[34px] w-[91px] shrink-0">
          <Image src="/images/cbahi.png" alt="CBAHI" fill className="object-contain" sizes="91px" />
        </span>
        <span className="text-[12px] leading-snug text-ink-soft">{text}</span>
      </div>
    );
  }
  return (
    <div className="rise-in mt-8 flex max-w-[480px] items-center gap-3.5 border-t border-line/20 pt-5" style={{ animationDelay: "1.35s" }}>
      <span className="relative h-[40px] w-[107px] shrink-0">
        <Image src="/images/cbahi.png" alt="CBAHI" fill className="object-contain" sizes="107px" />
      </span>
      <span className="text-[13px] font-semibold leading-snug text-ink-soft">{text}</span>
    </div>
  );
}
