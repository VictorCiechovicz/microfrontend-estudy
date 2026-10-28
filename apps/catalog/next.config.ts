import type { NextConfig } from "next";

const SHELL_URL = process.env.SHELL_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  assetPrefix: "/catalog-static",
  transpilePackages: ["@lab/ui", "@lab/db", "@lab/cache-sync", "@lab/mf-host"],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.md": { condition: { query: "?raw" }, type: "text" },
    },
  },
  experimental: {
    serverActions: {
      allowedOrigins: [new URL(SHELL_URL).host],
    },
    turbopackRustReactCompiler: true,
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1",
  },
};

export default nextConfig;
