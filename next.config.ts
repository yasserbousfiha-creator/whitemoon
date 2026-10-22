import type { NextConfig } from "next";

// The internal portals (lab, warehouse, management) live on their own project at
// portal.whitemoonclinic.com. Their sign-in is reachable from the public site
// only by typing /login — nothing on the site links to it.
const PORTALS = "https://portal.whitemoonclinic.com";

const nextConfig: NextConfig = {
  // Doctor photos uploaded from /admin are stored in Supabase Storage (bucket "doctors").
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/doctors/**" }],
  },
  experimental: {
    // Photo uploads from /admin are shrunk in the browser first; this leaves room for one that couldn't be.
    serverActions: { bodySizeLimit: "4mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No other site may show these pages in a frame (clicks on /admin could be hijacked from under it).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/login", destination: `${PORTALS}/login`, permanent: false },
      { source: "/portal", destination: `${PORTALS}/portal`, permanent: false },
      // Visit ratings: the branch QR posters point here (short link), the page lives on the portals.
      // /feedback now; /rate is the old link on posters already printed.
      { source: "/feedback", destination: `${PORTALS}/feedback`, permanent: false },
      { source: "/feedback/:code", destination: `${PORTALS}/feedback/:code`, permanent: false },
      { source: "/rate", destination: `${PORTALS}/feedback`, permanent: false },
      { source: "/rate/:code", destination: `${PORTALS}/feedback/:code`, permanent: false },
      // Job applications: the always-ready link for every opening (managed in the management portal).
      { source: "/careers", destination: `${PORTALS}/careers`, permanent: false },
      { source: "/careers/:slug", destination: `${PORTALS}/careers/:slug`, permanent: false },
    ];
  },
};

export default nextConfig;
