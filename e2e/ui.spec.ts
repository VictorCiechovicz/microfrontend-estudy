import { expect, test } from "@playwright/test";

for (const path of ["/", "/catalog/pt", "/account"]) {
  test(`site header and footer render on ${path}`, async ({ page }) => {
    await page.goto(path);
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Início" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(
      header.getByRole("link", { name: "Catálogo" }),
    ).toHaveAttribute("href", "/catalog/pt");
    await expect(
      header.getByRole("link", { name: "Minha conta" }),
    ).toHaveAttribute("href", "/account");
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
}

test("price renders in BRL on the catalog page", async ({ page }) => {
  await page.goto("/catalog/pt");
  await expect(page.getByTestId("featured-price")).toContainText(
    /R\$ \d+,\d{2}/,
  );
});
