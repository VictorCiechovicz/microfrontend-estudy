import { existsSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("lang root param localizes deep components", async ({ page }) => {
  await page.goto("/catalog/pt/products/1");
  await expect(page.getByRole("heading", { name: "Avaliações" })).toBeVisible();

  await page.goto("/catalog/en/products/1");
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
});

test("unsupported lang is 404", async ({ page }) => {
  const response = await page.goto("/catalog/xx");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("unknown product is 404, not the stock error UI", async ({ page }) => {
  const response = await page.goto("/catalog/pt/products/9999");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.getByText("Estoque indisponível")).toHaveCount(0);
});

test("non-prerendered product serves and then caches", async ({ page }) => {
  const first = await page.goto("/catalog/pt/products/10");
  expect(first?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Produto 10",
  );

  await expect
    .poll(() => routeCacheHas("catalog/pt/products/10.html"))
    .toBe(true);

  const second = await page.goto("/catalog/pt/products/10");
  expect(second?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Produto 10",
  );
});

function routeCacheHas(suffix: string): boolean {
  const root = "apps/catalog/.next/server/route-cache";
  if (!existsSync(root)) return false;
  return readdirSync(root, { recursive: true, encoding: "utf8" }).some(
    (entry) => entry.endsWith(suffix),
  );
}

test("stock error boundary retries the server component", async ({
  page,
  request,
}) => {
  const fault = await request.post("/catalog/api/lab/faults", {
    data: { key: "stock", count: 1 },
  });
  expect(fault.status()).toBe(200);
  await page.goto("/catalog/pt/products/4");
  await expect(page.getByText("Estoque indisponível")).toBeVisible();
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(page.getByText(/em estoque/)).toBeVisible();
});

test("faults endpoint rejects an invalid body", async ({ request }) => {
  const response = await request.post("/catalog/api/lab/faults", {
    data: { key: "price", count: 1 },
  });
  expect(response.status()).toBe(400);
});

test("faults endpoint caps the count at 100", async ({ request }) => {
  const response = await request.post("/catalog/api/lab/faults", {
    data: { key: "stock", count: 101 },
  });
  expect(response.status()).toBe(400);
});

test("related and popular blocks follow the page language", async ({
  page,
}) => {
  await page.goto("/catalog/pt/products/1");
  const related = page.getByRole("region", { name: "Relacionados" });
  const popular = page.getByRole("region", { name: "Populares" });
  await expect(related.getByRole("link").first()).toHaveText(/^Produto \d+$/);
  await expect(popular.getByRole("link").first()).toHaveText(/^Produto \d+$/);
  for (const link of await related.getByRole("link").all()) {
    await expect(link).toHaveText(/^Produto \d+$/);
  }
  for (const link of await popular.getByRole("link").all()) {
    await expect(link).toHaveText(/^Produto \d+$/);
  }
});

test("opengraph image is generated", async ({ request }) => {
  const response = await request.get("/catalog/pt/products/1/opengraph-image");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});
