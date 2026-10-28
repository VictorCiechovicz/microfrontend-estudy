import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

const SHELL_URL = process.env.SHELL_URL || "http://localhost:3000";
const WIDGETS_URL =
  process.env.NEXT_PUBLIC_WIDGETS_URL || "http://localhost:3003";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "widgets",
      exposes: {
        "./HelloWidget": "./src/HelloWidget.tsx",
        "./CartWidget": "./src/CartWidget.tsx",
        "./Recommendations": "./src/Recommendations.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: false },
        "react/jsx-runtime": { singleton: true, requiredVersion: false },
        "react/jsx-dev-runtime": { singleton: true, requiredVersion: false },
        "react-dom": { singleton: true, requiredVersion: false },
        "react-dom/client": { singleton: true, requiredVersion: false },
      },
      experiments: { asyncStartup: true },
    }),
  ],
  source: {
    entry: { index: "./src/standalone.tsx" },
  },
  html: {
    template: "./index.html",
  },
  server: {
    port: 3003,
    headers: { "Access-Control-Allow-Origin": "*" },
    proxy: {
      "/account/api": SHELL_URL,
      "/catalog/api": SHELL_URL,
    },
  },
  output: {
    assetPrefix: `${WIDGETS_URL.replace(/\/$/, "")}/`,
  },
});
