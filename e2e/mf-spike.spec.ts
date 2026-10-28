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
  await expect(
    page.getByRole("main").getByTestId("widget-fallback"),
  ).toBeVisible();
});

test("widget runs on the host's React, JSX runtime included", async ({
  page,
}) => {
  await page.goto("/catalog/pt");
  await expect(page.getByTestId("hello-widget")).toBeVisible();
  const shared = await page.evaluate(() => {
    type Entry = { from: string; loaded?: boolean; useIn?: string[] };
    const map = (
      window as unknown as {
        __FEDERATION__: {
          __SHARE__: Record<
            string,
            Record<string, Record<string, Record<string, Entry>>>
          >;
        };
      }
    ).__FEDERATION__.__SHARE__;
    return Object.values(map).flatMap((scopes) =>
      Object.values(scopes).flatMap((pkgs) =>
        Object.entries(pkgs).flatMap(([pkg, versions]) =>
          Object.values(versions).map((entry) => ({
            pkg,
            from: entry.from,
            loaded: Boolean(entry.loaded),
            useIn: entry.useIn ?? [],
          })),
        ),
      ),
    );
  });
  for (const pkg of ["react", "react-dom/client", "react/jsx-runtime"]) {
    expect(shared).toContainEqual(
      expect.objectContaining({
        pkg,
        from: "lab_host",
        useIn: expect.arrayContaining(["widgets"]),
      }),
    );
  }
  expect(shared.filter((e) => e.from === "widgets" && e.loaded)).toEqual([]);
});
