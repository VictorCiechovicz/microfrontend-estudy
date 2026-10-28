import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/catalog-static",
  transpilePackages: ["@lab/ui", "@lab/db", "@lab/cache-sync", "@lab/mf-host"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.md": { condition: { query: "?raw" }, type: "text" },
    },
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
  },
};

export default nextConfig;
