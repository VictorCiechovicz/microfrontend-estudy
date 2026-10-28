import { expect, test } from "@playwright/test";

test("logged-out visit to an account page redirects to login with next", async ({
  page,
}) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Forders$/);
  await expect(page.locator("html")).toHaveAttribute("data-zone", "account");
});

test("login as Ana lands on next and shows her name in the headers", async ({
  page,
}) => {
  await page.goto("/account/orders");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/account/orders");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orders");
  await expect(page.getByRole("banner")).toContainText("Ana");

  await page.goto("/catalog/pt");
  await expect(page.getByRole("banner")).toContainText("Ana");
});

test("logout clears the session and returns to login", async ({ page }) => {
  await page.goto("/account/login");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/account");

  await page
    .getByRole("banner")
    .getByRole("button", { name: "Log out" })
    .click();
  await expect(page).toHaveURL("/account/login");
  await expect(page.getByRole("banner")).not.toContainText("Ana");

  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/account\/login\?next=%2Forders$/);
});

test("login ignores an off-zone next target", async ({ page }) => {
  await page.goto("/account/login?next=%2F%2Fevil.example");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/account");
});

test("login and internal endpoints stay reachable without a session", async ({
  request,
}) => {
  const login = await request.get("/account/login", { maxRedirects: 0 });
  expect(login.status()).toBe(200);
  const internal = await request.post(
    "http://localhost:3002/account/internal/revalidate",
    { data: { tags: ["stock:1"] }, maxRedirects: 0 },
  );
  expect(internal.status()).toBe(401);
});

for (const value of ["999", "abc", "1.0"]) {
  test(`stale or malformed session cookie "${value}" counts as logged out`, async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: "lab_user", value, url: "http://localhost:3000" },
    ]);
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/account\/login(\?next=%2Forders)?$/);
    await expect(page.getByTestId("user-name")).toHaveCount(0);

    await page.goto("/catalog/pt");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Log in" }),
    ).toBeVisible();
    await expect(page.getByTestId("user-name")).toHaveCount(0);
  });
}

test("login rejects a next target with control characters", async ({
  page,
}) => {
  await page.goto("/account/login?next=%2F%09%2Fevil.example");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/account");
});

test("login with an unknown user keeps the next target", async ({ page }) => {
  await page.goto("/account/orders");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Ana").evaluate((radio: HTMLInputElement) => {
    radio.value = "999";
  });
  await page.getByLabel("Ana").check();
  const action = page.waitForResponse((r) => r.request().method() === "POST");
  await page.getByRole("button", { name: "Log in" }).click();
  await action;
  await expect(page).toHaveURL(/\/account\/login\?next=%2Forders$/);
  await expect(page.getByTestId("user-name")).toHaveCount(0);
  expect(
    (await page.context().cookies()).some((c) => c.name === "lab_user"),
  ).toBe(false);
});
