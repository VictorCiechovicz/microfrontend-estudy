import { expect, type Page, test } from "@playwright/test";

const STOCK_PRODUCT_ID = 6;
const PRICE_PRODUCT_ID = 7;
const SWR_PRODUCT_ID = 6;
const SEED_PRICES = { [STOCK_PRODUCT_ID]: 1600, [PRICE_PRODUCT_ID]: 1700 };

async function loginAsBruno(page: Page) {
  await page.goto("/account/login");
  await page.getByLabel("Bruno").check();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/account");
}

type CartBody = { lines: { productId: number; priceCents: number }[] };

async function readCart(page: Page): Promise<CartBody> {
  const response = await page.request.get("/account/api/cart");
  expect(response.status()).toBe(200);
  return response.json();
}

async function clearCart(page: Page) {
  for (const line of (await readCart(page)).lines) {
    const response = await page.request.delete(
      `/account/api/cart?productId=${line.productId}`,
    );
    expect(response.status()).toBe(200);
  }
}

async function putInCart(page: Page, productId: number, qty: number) {
  const response = await page.request.post("/account/api/cart", {
    data: { productId, qty },
  });
  expect(response.status()).toBe(200);
}

async function cartPriceOf(page: Page, productId: number) {
  return (await readCart(page)).lines.find((l) => l.productId === productId)
    ?.priceCents;
}

async function submitPrice(page: Page, productId: string, priceCents: string) {
  await page.goto("/catalog/pt/admin");
  await page.getByLabel("Product id").fill(productId);
  await page.getByLabel("Price (cents)").fill(priceCents);
  await page.getByRole("button", { name: "Update price" }).click();
}

async function setPrice(page: Page, productId: number, priceCents: number) {
  await submitPrice(page, String(productId), String(priceCents));
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    `Product ${productId} now costs ${priceCents} cents`,
  );
}

function unreadBadge(page: Page) {
  return page
    .getByRole("banner")
    .getByRole("status", { name: /unread notifications/ });
}

async function stockOf(page: Page): Promise<number> {
  const stock = page.getByTestId("stock");
  await expect(stock).toHaveText(/^\d+ em estoque$/);
  return Number.parseInt((await stock.textContent()) ?? "", 10);
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await loginAsBruno(page);
  for (const [id, cents] of Object.entries(SEED_PRICES)) {
    await setPrice(page, Number(id), cents);
  }
  await clearCart(page);
  await page.close();
});

test("order placed in account updates stock shown in catalog", async ({
  page,
}) => {
  await loginAsBruno(page);
  await clearCart(page);
  await page.goto(`/catalog/pt/products/${STOCK_PRODUCT_ID}`);
  const before = await stockOf(page);
  expect(before).toBeGreaterThanOrEqual(2);

  await putInCart(page, STOCK_PRODUCT_ID, 2);
  await page.goto("/account/orders");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    /^Order #\d+ placed$/,
  );

  await page.goto(`/catalog/pt/products/${STOCK_PRODUCT_ID}`);
  await expect(page.getByTestId("stock")).toHaveText(
    `${before - 2} em estoque`,
  );
});

test("price change in catalog updates cart total in account", async ({
  page,
}) => {
  await loginAsBruno(page);
  await clearCart(page);
  await putInCart(page, PRICE_PRODUCT_ID, 2);
  await page.goto("/account/orders");
  await expect(page.getByTestId("cart-total")).toContainText("34,00");

  await setPrice(page, PRICE_PRODUCT_ID, 2345);

  await page.goto("/account/orders");
  await expect(page.getByTestId("cart-total")).toContainText("46,90");
});

test("reading a notification updates the catalog header badge", async ({
  page,
}) => {
  await loginAsBruno(page);
  await page.goto("/catalog/pt");
  await expect(unreadBadge(page)).toHaveText(/^[1-9]\d*$/);

  await page.goto("/account/notifications");
  const markRead = page
    .getByRole("main")
    .getByRole("button", { name: "Mark as read" });
  await expect(markRead.first()).toBeVisible();
  for (let left = await markRead.count(); left > 0; left--) {
    await markRead.first().click();
    await expect(markRead).toHaveCount(left - 1);
  }

  await page.goto("/catalog/pt");
  await expect(unreadBadge(page)).toHaveText("0");
});

test("catalog price change serves stale once then fresh (SWR)", async ({
  page,
}) => {
  await loginAsBruno(page);
  const price = page.getByTestId("product-price");
  await page.goto(`/catalog/pt/products/${SWR_PRODUCT_ID}`);
  await expect(price).toContainText("16,00");

  await setPrice(page, SWR_PRODUCT_ID, 1999);

  await page.goto(`/catalog/pt/products/${SWR_PRODUCT_ID}`);
  test.info().annotations.push({
    type: "first visit after setPrice",
    description: (await price.textContent()) ?? "",
  });
  await expect
    .poll(
      async () => {
        await page.goto(`/catalog/pt/products/${SWR_PRODUCT_ID}`);
        return price.textContent();
      },
      { timeout: 15_000, intervals: [250, 500, 1000] },
    )
    .toContain("19,99");
});

test.describe("price admin", () => {
  test("hides the form from logged-out users", async ({ page }) => {
    await page.goto("/catalog/pt/admin");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Price admin",
    );
    await expect(page.getByRole("main").getByRole("link")).toHaveText("Log in");
    await expect(page.getByLabel("Product id")).toHaveCount(0);
  });

  test("redirects to login when the session is gone", async ({
    page,
    context,
  }) => {
    await loginAsBruno(page);
    await clearCart(page);
    await putInCart(page, PRICE_PRODUCT_ID, 1);
    const before = await cartPriceOf(page, PRICE_PRODUCT_ID);

    await page.goto("/catalog/pt/admin");
    await expect(page.getByLabel("Product id")).toBeVisible();
    await context.clearCookies();
    await page.getByLabel("Product id").fill(String(PRICE_PRODUCT_ID));
    await page.getByLabel("Price (cents)").fill("4321");
    await page.getByRole("button", { name: "Update price" }).click();
    await expect(page).toHaveURL(
      /\/account\/login\?next=%2Fcatalog%2Fpt%2Fadmin$/,
    );

    await loginAsBruno(page);
    expect(await cartPriceOf(page, PRICE_PRODUCT_ID)).toBe(before);
    await clearCart(page);
  });

  test("rejects invalid input without changing the price", async ({ page }) => {
    await loginAsBruno(page);
    await clearCart(page);
    await putInCart(page, PRICE_PRODUCT_ID, 1);
    const before = await cartPriceOf(page, PRICE_PRODUCT_ID);

    for (const [productId, priceCents] of [
      ["9999", "100"],
      ["0", "100"],
      ["abc", "100"],
      ["7.5", "100"],
      ["7", "0"],
      ["7", "-5"],
      ["7", "1.5"],
      ["7", "abc"],
      ["7", "100000001"],
      ["7", "99999999999999999999"],
    ]) {
      await submitPrice(page, productId, priceCents);
      await expect(
        page.getByRole("main").getByRole("alert"),
        `${productId} / ${priceCents}`,
      ).toHaveText(/^(Unknown product|Invalid price)$/);
    }
    expect(await cartPriceOf(page, PRICE_PRODUCT_ID)).toBe(before);
    await clearCart(page);
  });
});
