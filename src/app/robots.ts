import type { MetadataRoute } from "next";

// Search engines read the public pages; the staff dashboard and the API stay out of results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: "https://whitemoonclinic.com/sitemap.xml",
  };
}
