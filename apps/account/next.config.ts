import type { NextConfig } from "next";

const SHELL_URL = process.env.SHELL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  basePath: "/account",
  transpilePackages: ["@lab/ui", "@lab/db", "@lab/cache-sync", "@lab/mf-host"],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: [new URL(SHELL_URL).host],
    },
    useOffline: true,
    turbopackGc: true,
    turbopackLazyDynamicImports: true,
    turbopackPluginRuntimeStrategy: "workerThreads",
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
  },
};

export default nextConfig;
