import type { MetadataRoute } from "next";
import { BRANCH_IDS } from "@/lib/branches";

// For search engines: the home page and the three branch pages (/admin is left out on purpose).
export default function sitemap(): MetadataRoute.Sitemap {
  const site = "https://whitemoonclinic.com";
  return [
    { url: site, changeFrequency: "weekly", priority: 1 },
    ...BRANCH_IDS.map((id) => ({ url: `${site}/${id}`, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
