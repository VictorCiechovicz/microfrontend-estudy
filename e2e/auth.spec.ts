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
