import { expect, type Page, test } from "@playwright/test";

const WIDGETS_PRODUCT_ID = 5;
const PRODUCT_PATH = `/catalog/pt/products/${WIDGETS_PRODUCT_ID}`;

async function loginAsCarla(page: Page) {
  await page.goto("/account/login");
  await page.getByLabel("Carla").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/account");
}

async function emptyCart(page: Page) {
  const cart = await page.request.get("/account/api/cart");
  expect(cart.status()).toBe(200);
  const { lines } = (await cart.json()) as { lines: { productId: number }[] };
  for (const line of lines) {
    const removed = await page.request.delete(
      `/account/api/cart?productId=${line.productId}`,
    );
    expect(removed.status()).toBe(200);
  }
}

function cartBadge(page: Page) {
  return page.getByRole("banner").getByRole("status", { name: /in cart/ });
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await loginAsCarla(page);
  await emptyCart(page);
  await page.close();
});

test("cart widget follows the cart across zones", async ({ page }) => {
  await loginAsCarla(page);
  await emptyCart(page);

  await page.goto(PRODUCT_PATH);
  await expect(cartBadge(page)).toHaveText("0");
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(cartBadge(page)).toHaveText("1");
  await expect(cartBadge(page)).toHaveAccessibleName(/1/);

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Account", exact: true })
    .click();
  await expect(page).toHaveURL("/account");
  await expect(page.locator("html")).toHaveAttribute("data-zone", "account");
  await expect(cartBadge(page)).toHaveText("1");
});

test("cart widget refetches when another part of the page announces a change", async ({
  page,
}) => {
  await loginAsCarla(page);
  await emptyCart(page);
  await page.goto("/account");
  await expect(cartBadge(page)).toHaveText("0");

  const added = await page.request.post("/account/api/cart", {
    data: { productId: WIDGETS_PRODUCT_ID, qty: 2 },
  });
  expect(added.status()).toBe(200);
  await expect(cartBadge(page)).toHaveText("0");
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("lab:cart-changed", { detail: { count: 2 } }),
    ),
  );
  await expect(cartBadge(page)).toHaveText("2");
});

test("recommendations list four other products", async ({ page }) => {
  await page.goto(PRODUCT_PATH);
  const block = page.getByRole("region", { name: "Recommended" });
  const links = block.getByRole("link");
  await expect(links).toHaveCount(4);
  for (const href of await links.evaluateAll((as) =>
    as.map((a) => a.getAttribute("href")),
  )) {
    expect(href).toMatch(/^\/catalog\/pt\/products\/\d+$/);
    expect(href).not.toBe(PRODUCT_PATH);
  }
});

test("recommendations API excludes the given product", async ({ request }) => {
  const response = await request.get(
    `/catalog/api/recommendations?exclude=${WIDGETS_PRODUCT_ID}`,
  );
  expect(response.status()).toBe(200);
  const { products } = (await response.json()) as {
    products: { id: number; name: string; priceCents: number; href: string }[];
  };
  expect(products).toHaveLength(4);
  for (const product of products) {
    expect(product.id).not.toBe(WIDGETS_PRODUCT_ID);
    expect(product.href).toBe(`/catalog/pt/products/${product.id}`);
    expect(typeof product.name).toBe("string");
    expect(Number.isInteger(product.priceCents)).toBe(true);
  }
  const invalid = await request.get("/catalog/api/recommendations?exclude=abc");
  expect(invalid.status()).toBe(400);
});

test("logged out: cart API is 401, widget stays quiet, add to cart goes to login", async ({
  page,
  request,
}) => {
  const api = await request.get("/account/api/cart", { maxRedirects: 0 });
  expect(api.status()).toBe(401);
  expect(await api.json()).toEqual({ error: "unauthenticated" });

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const widgetCartRequest = page.waitForResponse((r) =>
    r.url().endsWith("/account/api/cart"),
  );
  await page.goto(PRODUCT_PATH);
  expect((await widgetCartRequest).status()).toBe(401);
  await expect(
    page.getByRole("region", { name: "Recommended" }).getByRole("link"),
  ).toHaveCount(4);
  await expect(cartBadge(page)).toHaveCount(0);
  await expect(page.getByTestId("widget-fallback")).toHaveCount(0);

  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page).toHaveURL(
    `/account/login?next=${encodeURIComponent(PRODUCT_PATH)}`,
  );
  expect(errors).toEqual([]);
});

test("a widget that throws while rendering falls back without breaking the page", async ({
  page,
}) => {
  await page.route("**/catalog/api/recommendations**", (route) =>
    route.fulfill({ json: { unexpected: true } }),
  );
  await page.goto(PRODUCT_PATH);
  await expect(page.getByTestId("widget-fallback")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Produto 5");
  await expect(
    page.getByRole("button", { name: "Adicionar ao carrinho" }),
  ).toBeVisible();
});
