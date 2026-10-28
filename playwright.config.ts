import { defineConfig, devices } from "@playwright/test";

const zones = [
  { app: "shell", port: 3000, readyPath: "/" },
  { app: "catalog", port: 3001, readyPath: "/catalog/pt" },
  { app: "account", port: 3002, readyPath: "/account" },
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
  webServer: zones.map(({ app, port, readyPath }) => ({
    command: `pnpm --filter ${app} start`,
    url: `http://localhost:${port}${readyPath}`,
    reuseExistingServer: false,
  })),
});
