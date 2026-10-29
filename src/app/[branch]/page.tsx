import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/HomePage";
import { BRANCH_IDS, isBranchId } from "@/lib/branches";
import { arContent, enContent } from "@/lib/content";

// One page per branch: /khamseen, /shahar, /wisam. Anything else is a 404.
export const dynamicParams = false;
// Rebuilt at most every 5 minutes with the latest doctors (lib/doctors-server.ts), besides right after /admin edits.
export const revalidate = 300;

export function generateStaticParams() {
  return BRANCH_IDS.map((branch) => ({ branch }));
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }): Promise<Metadata> {
  const { branch } = await params;
  const b = arContent.branches.find((x) => x.id === branch);
  const en = enContent.branches.find((x) => x.id === branch)?.name;
  const services = arContent.services.filter((s) => !s.branches || s.branches.includes(branch as never)).map((s) => s.title);
  const description = `${b?.address} — ${services.join("، ")}. احجز موعدك أونلاين.`;
  return {
    title: `${b?.name} | ${en} — White Moon Medical Complex`,
    description,
    alternates: { canonical: `/${branch}` },
    // A page's openGraph replaces the root layout's, so the shared fields are repeated.
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: "مجمع وايت مون الطبي | White Moon",
      title: `مجمع وايت مون الطبي — ${b?.name}`,
      description,
      url: `/${branch}`,
      images: [{ url: `/og/${branch}.jpg`, width: 1200, height: 630, alt: `مجمع وايت مون الطبي — ${b?.name}` }],
    },
  };
}

export default async function BranchPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!isBranchId(branch)) notFound();
  return <HomePage branch={branch} />;
}
