import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/account",
  transpilePackages: ["@lab/cache-sync"],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
