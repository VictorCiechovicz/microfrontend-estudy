import type { NextConfig } from "next";
import { ACCOUNT_URL, CATALOG_URL } from "./lib/zone-urls";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  async rewrites() {
    return [
      { source: "/catalog", destination: `${CATALOG_URL}/catalog` },
      {
        source: "/catalog/:path+",
        destination: `${CATALOG_URL}/catalog/:path+`,
      },
      {
        source: "/catalog-static/:path+",
        destination: `${CATALOG_URL}/catalog-static/:path+`,
      },
      { source: "/account", destination: `${ACCOUNT_URL}/account` },
      {
        source: "/account/:path+",
        destination: `${ACCOUNT_URL}/account/:path+`,
      },
    ];
  },
};

export default nextConfig;
