import { expect, test } from "@playwright/test";

test("home declares png and svg icons in head", async ({ page }) => {
  await page.goto("/");
  const icons = page.locator('head link[rel="icon"]');
  await expect(icons).toHaveCount(2);
  const types = await icons.evaluateAll((links) =>
    links.map((link) => link.getAttribute("type")),
  );
  expect(types.sort()).toEqual(["image/png", "image/svg+xml"]);
});

test("home is served as a prerendered page", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-nextjs-prerender"]).toMatch(/^1(, 1)*$/);
});
