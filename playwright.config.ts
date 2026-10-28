import { defineConfig, devices } from "@playwright/test";

const servers = [
  { app: "shell", port: 3000, readyPath: "/" },
  { app: "catalog", port: 3001, readyPath: "/catalog/pt" },
  { app: "account", port: 3002, readyPath: "/account" },
  { app: "widgets", port: 3003, readyPath: "/mf-manifest.json" },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: servers.map(({ app, port, readyPath }) => ({
    command: `pnpm --filter ${app} start`,
    url: `http://localhost:${port}${readyPath}`,
    reuseExistingServer: false,
  })),
});
