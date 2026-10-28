import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/account",
  transpilePackages: ["@lab/ui", "@lab/db", "@lab/cache-sync", "@lab/mf-host"],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    useOffline: true,
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
  },
};

export default nextConfig;
