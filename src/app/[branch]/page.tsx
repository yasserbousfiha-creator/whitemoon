import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/HomePage";
import { BRANCH_IDS, isBranchId } from "@/lib/branch-context";
import { arContent, enContent } from "@/lib/content";

// One page per branch: /khamseen, /shahar, /wisam. Anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return BRANCH_IDS.map((branch) => ({ branch }));
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }): Promise<Metadata> {
  const { branch } = await params;
  const ar = arContent.branches.find((b) => b.id === branch)?.name;
  const en = enContent.branches.find((b) => b.id === branch)?.name;
  return { title: `${ar} | ${en} — White Moon Medical Complex` };
}

export default async function BranchPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  if (!isBranchId(branch)) notFound();
  return <HomePage branch={branch} />;
}
