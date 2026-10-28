import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

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
    await expect(page.getByRole("region", { name: "Related" })).toBeVisible();
    await expect(page.getByText("Carregando avaliações…")).toBeVisible();
    await expect(page.getByTestId("review")).toHaveCount(0);
  });
  await expect(page.getByTestId("review").first()).toBeVisible();
});

test("related products link to other product pages", async ({ page }) => {
  await page.goto("/catalog/pt/products/2");
  const links = page.getByRole("region", { name: "Related" }).getByRole("link");
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
  await expect(reviews).toBeInViewport();
});

test("guides list comes from markdown files", async ({ page }) => {
  await page.goto("/catalog/pt/guides");
  const guides = page.getByRole("main").getByRole("listitem");
  await expect(guides).toHaveCount(3);
  await guides.first().getByRole("link").click();
  await expect(page).toHaveURL(/\/catalog\/pt\/guides\/[a-z-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
    "Guides",
  );
});
