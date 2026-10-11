import type { NextConfig } from "next";

// The internal portals (lab, warehouse, management) live on their own project at
// portal.whitemoonclinic.com. Their sign-in is reachable from the public site
// only by typing /login — nothing on the site links to it.
const PORTALS = "https://portal.whitemoonclinic.com";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/login", destination: `${PORTALS}/login`, permanent: false },
      { source: "/portal", destination: `${PORTALS}/portal`, permanent: false },
    ];
  },
};

export default nextConfig;
