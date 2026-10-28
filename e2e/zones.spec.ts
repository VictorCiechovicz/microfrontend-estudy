import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __marker?: number;
  }
}

test("shell serves home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab Store");
});

test("catalog zone is served under /catalog", async ({ page }) => {
  await page.goto("/catalog/pt");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catalog");
  await expect(page.locator("html")).toHaveAttribute("data-zone", "catalog");
});

test("account zone is served under /account", async ({ page }) => {
  await page.goto("/account");
  await expect(page.locator("html")).toHaveAttribute("data-zone", "account");
});

test("cross-zone link is a hard navigation", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__marker = 1;
  });
  await page.getByRole("link", { name: "Catalog" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-zone", "catalog");
  expect(await page.evaluate(() => window.__marker)).toBeUndefined();
});

test("same-zone link is a soft navigation", async ({ page }) => {
  await page.goto("/catalog/pt");
  await page.evaluate(() => {
    window.__marker = 1;
  });
  await page.getByRole("link", { name: "Guides" }).click();
  await expect(page).toHaveURL("/catalog/pt/guides");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Guides");
  expect(await page.evaluate(() => window.__marker)).toBe(1);
});

test("proxy routes /catalog/sale by flag cookie", async ({ page, context }) => {
  await page.goto("/catalog/sale");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sale A");

  await context.addCookies([
    { name: "lab_flag_sale", value: "b", url: "http://localhost:3000" },
  ]);
  await page.goto("/catalog/sale");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sale B");
});
