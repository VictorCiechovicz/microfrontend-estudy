import { existsSync, readdirSync } from "node:fs";
import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __viewTransitionAnimations?: string[];
  }
}

function routeCacheHas(suffix: string): boolean {
  const root = "apps/catalog/.next/server/route-cache";
  if (!existsSync(root)) return false;
  return readdirSync(root, { recursive: true, encoding: "utf8" }).some(
    (entry) => entry.endsWith(suffix),
  );
}

test("product title is instant, reviews stream after navigation", async ({
  page,
}) => {
  await page.goto("/catalog/pt");
  await instant(page, async () => {
    await page.getByRole("link", { name: "Produto 2", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/catalog/pt/products/2");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Produto 2",
    );
    await expect(
      page.getByRole("region", { name: "Relacionados" }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Populares" })).toBeVisible();
    await expect(page.getByText("Carregando avaliações…")).toBeVisible();
    await expect(page.getByTestId("review")).toHaveCount(0);
  });
  await expect(page.getByTestId("review").first()).toBeVisible();
});

test("popular block is out of the App Shell a default link loads", async ({
  page,
  request,
}) => {
  await page.goto("/catalog/pt/products/2");
  const target = page
    .getByRole("region", { name: "Relacionados" })
    .getByRole("link")
    .first();
  const href = await target.getAttribute("href");
  await request.get(`${href}`);
  await expect.poll(() => routeCacheHas(`${href}.html`)).toBe(true);
  await page.reload();
  await instant(page, async () => {
    await target.click();
    await page.waitForURL((url) => url.pathname !== "/catalog/pt/products/2");
    await expect(page.getByText("Carregando populares…")).toBeVisible();
    await expect(page.getByRole("region", { name: "Populares" })).toHaveCount(
      0,
    );
  });
  await expect(page.getByRole("region", { name: "Populares" })).toBeVisible();
});

test("slide transition type animates the page change", async ({ page }) => {
  await page.goto("/catalog/pt");
  await page.evaluate(() => {
    window.__viewTransitionAnimations = [];
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((
      update: Parameters<typeof document.startViewTransition>[0],
    ) => {
      const transition = start(update);
      transition.ready.then(() => {
        for (const animation of document.getAnimations()) {
          if (animation instanceof CSSAnimation) {
            window.__viewTransitionAnimations?.push(animation.animationName);
          }
        }
      });
      return transition;
    }) as typeof document.startViewTransition;
  });
  await page.getByRole("link", { name: "Produto 3", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/catalog/pt/products/3");
  await expect
    .poll(() => page.evaluate(() => window.__viewTransitionAnimations))
    .toEqual(expect.arrayContaining(["slide-out", "slide-in"]));
});

test("related products link to other product pages", async ({ page }) => {
  await page.goto("/catalog/pt/products/2");
  const links = page
    .getByRole("region", { name: "Relacionados" })
    .getByRole("link");
  await expect(links).toHaveCount(4);
  for (const href of await links.evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href")),
  )) {
    expect(href).toMatch(/^\/catalog\/pt\/products\/\d+$/);
    expect(href).not.toBe("/catalog/pt/products/2");
  }
});

test("see reviews button scrolls to and focuses the reviews section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 240 });
  await page.goto("/catalog/pt/products/2");
  const reviews = page.getByRole("region", { name: "Avaliações" });
  await expect(reviews.getByTestId("review").first()).toBeAttached();
  await page.getByRole("button", { name: "Ver avaliações" }).click();
  await expect(reviews).toBeFocused();
  await expect
    .poll(() => reviews.evaluate((el) => el.getBoundingClientRect().top))
    .toBeCloseTo(0, 0);
});

test("guides list comes from markdown files", async ({ page }) => {
  await page.goto("/catalog/pt/guides");
  const guides = page.getByRole("main").getByRole("listitem");
  await expect(guides).toHaveCount(3);
  await guides.first().getByRole("link").click();
  await expect(page).toHaveURL("/catalog/pt/guides/caring-for-your-order");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Caring for your order",
  );
});

test("unknown guide is 404", async ({ page }) => {
  const response = await page.goto("/catalog/pt/guides/nope");
  expect(response?.status()).toBe(404);
});
