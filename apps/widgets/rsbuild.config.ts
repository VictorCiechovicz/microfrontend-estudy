import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "widgets",
      exposes: {
        "./HelloWidget": "./src/HelloWidget.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: false },
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
  },
  output: {
    assetPrefix: "http://localhost:3003/",
  },
});
