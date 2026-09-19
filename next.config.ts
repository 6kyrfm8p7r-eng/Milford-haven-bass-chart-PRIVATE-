import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Keep the application deployable without depending on
  // proprietary hosting features.
  poweredByHeader: false,

  // Allow MapLibre and our geospatial components to operate
  // normally in the browser.
  experimental: {
    optimizePackageImports: ["@turf/turf"],
  },
};

export default nextConfig;
