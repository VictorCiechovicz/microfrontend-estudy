import { expect, test } from "@playwright/test";

for (const path of ["/", "/catalog/pt", "/account"]) {
  test(`site header and footer render on ${path}`, async ({ page }) => {
    await page.goto(path);
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(header.getByRole("link", { name: "Catalog" })).toHaveAttribute(
      "href",
      "/catalog/pt",
    );
    await expect(header.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account",
    );
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
}

test("price renders in BRL on the catalog page", async ({ page }) => {
  await page.goto("/catalog/pt");
  await expect(page.getByTestId("featured-price")).toContainText(
    /R\$ \d+,\d{2}/,
  );
});
