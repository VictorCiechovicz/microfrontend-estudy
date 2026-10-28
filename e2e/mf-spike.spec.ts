import { expect, test } from "@playwright/test";

test("remote widget renders inside catalog zone", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/catalog/pt");
  await expect(page.getByTestId("hello-widget")).toHaveText(
    "Hello from widgets",
  );
  expect(
    errors.filter((e) =>
      /Invalid hook call|more than one copy of React/.test(e),
    ),
  ).toEqual([]);
});

test("page still renders when widgets remote is down", async ({ page }) => {
  await page.route("http://localhost:3003/**", (r) => r.abort());
  await page.goto("/catalog/pt");
  await expect(
    page.getByRole("heading", { name: /Catálogo|Catalog/ }),
  ).toBeVisible();
  await expect(page.getByTestId("widget-fallback")).toBeVisible();
});
