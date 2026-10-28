import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/catalog-static",
  transpilePackages: ["@lab/mf-host"],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
