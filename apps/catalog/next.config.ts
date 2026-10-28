import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/catalog-static",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
