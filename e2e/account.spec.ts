import { instant } from "@next/playwright";
import { expect, type Page, test } from "@playwright/test";

const OFFLINE_PRODUCT_ID = 8;

async function loginAsAna(page: Page) {
  await page.goto("/account/login");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/account");
}

async function putInCart(page: Page, productId: number) {
  const response = await page.request.post("/account/api/cart", {
    data: { productId, qty: 1 },
  });
  expect(response.status()).toBe(200);
}

function unreadBadge(page: Page) {
  return page.getByRole("banner").getByRole("status", { name: /não lidas/ });
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await loginAsAna(page);
  await page.goto("/account/profile");
  await page.getByLabel("Nome").fill("Ana");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByTestId("user-name")).toHaveText("Ana");
  await page.close();
});

test("profile edit shows new name immediately (updateTag)", async ({
  page,
}) => {
  await loginAsAna(page);
  await page.goto("/account/profile");
  await expect(page.getByTestId("user-name")).toHaveText("Ana");
  await page.getByLabel("Nome").fill("Ana Lab");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByTestId("user-name")).toHaveText("Ana Lab");
  await expect(page.getByLabel("Nome")).toHaveValue("Ana Lab");
});

test("marking notification read updates header badge (refresh)", async ({
  page,
}) => {
  await loginAsAna(page);
  await page.goto("/account/notifications");
  const before = Number(await unreadBadge(page).textContent());
  expect(before).toBeGreaterThanOrEqual(1);
  await page
    .getByRole("main")
    .getByRole("button", { name: "Marcar como lida" })
    .first()
    .click();
  await expect(unreadBadge(page)).toHaveText(String(before - 1));
});

test("order detail opens as modal from list and as page on reload", async ({
  page,
}) => {
  await loginAsAna(page);
  await putInCart(page, OFFLINE_PRODUCT_ID);
  await page.goto("/account/orders");
  const cartBadge = page
    .getByRole("banner")
    .getByRole("status", { name: /no carrinho/ });
  await expect(cartBadge).toHaveText(/^[1-9]\d*$/);
  await page.getByRole("button", { name: "Fazer pedido" }).click();
  const row = page.getByTestId("order-row").first();
  await expect(row).toBeVisible();
  await expect(cartBadge).toHaveText("0");

  await row.getByRole("link").click();
  await expect(page).toHaveURL(/\/account\/orders\/\d+$/);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    /^Pedido #\d+$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedidos");
  await expect(dialog).toContainText("R$");

  await page
    .getByRole("banner")
    .getByRole("link", { name: /não lidas/ })
    .dispatchEvent("click");
  await expect(page).toHaveURL("/account/notifications");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goBack();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /^Pedido #\d+$/,
  );
});

for (const session of [null, "999"]) {
  test(`logged-out server action redirects to login (cookie ${session ?? "cleared"})`, async ({
    page,
    context,
  }) => {
    await loginAsAna(page);
    await page.goto("/account/profile");
    await expect(page.getByLabel("Nome")).toBeVisible();
    await context.clearCookies();
    if (session) {
      await context.addCookies([
        { name: "lab_user", value: session, url: "http://localhost:3000" },
      ]);
    }
    await page.getByLabel("Nome").fill("Nobody");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/account\/login(\?|$)/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Entrar");
  });
}

test("place order while offline completes when back online", async ({
  page,
  context,
}) => {
  await loginAsAna(page);
  await putInCart(page, OFFLINE_PRODUCT_ID);
  await page.goto("/account/orders");
  const rows = page.getByTestId("order-row");
  await expect(
    page.getByRole("region", { name: "Histórico de pedidos" }),
  ).toBeVisible();
  const before = await rows.count();

  await context.setOffline(true);
  await page.getByRole("button", { name: "Fazer pedido" }).click();
  await expect(
    page.getByText("Enviando pedido (offline, vai tentar de novo)…"),
  ).toBeVisible();
  await expect(page.getByText(/Você está offline/)).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByTestId("order-row").first()).toBeVisible();
  await expect(rows).toHaveCount(before + 1);
  await expect(page.getByText(/Você está offline/)).toHaveCount(0);
});

test("order history waits for navigation (navigation())", async ({ page }) => {
  await loginAsAna(page);
  await instant(page, async () => {
    await page.getByRole("link", { name: "Pedidos", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/account/orders");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pedidos");
    await expect(page.getByRole("region", { name: "Carrinho" })).toBeVisible();
    await expect(page.getByText("Carregando pedidos…")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Histórico de pedidos" }),
    ).toHaveCount(0);
  });
  await expect(
    page.getByRole("region", { name: "Histórico de pedidos" }),
  ).toBeVisible();
});

test.describe("cart API", () => {
  test("rejects a request without a session with 401", async ({ request }) => {
    for (const response of [
      await request.get("/account/api/cart", { maxRedirects: 0 }),
      await request.post("/account/api/cart", {
        data: { productId: 1, qty: 1 },
        maxRedirects: 0,
      }),
      await request.delete("/account/api/cart?productId=1", {
        maxRedirects: 0,
      }),
      await request.get("/account/api/cart", {
        headers: { cookie: "lab_user=999" },
        maxRedirects: 0,
      }),
    ]) {
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: "unauthenticated" });
    }
  });

  test("adds, lists and removes lines for the session user", async ({
    page,
  }) => {
    await loginAsAna(page);
    const added = await page.request.post("/account/api/cart", {
      data: { productId: OFFLINE_PRODUCT_ID, qty: 2 },
    });
    expect(added.status()).toBe(200);
    const body = await added.json();
    const line = body.lines.find(
      (l: { productId: number }) => l.productId === OFFLINE_PRODUCT_ID,
    );
    expect(line).toMatchObject({ productId: OFFLINE_PRODUCT_ID, qty: 2 });
    expect(body.totalCents).toBe(
      body.lines.reduce(
        (sum: number, l: { priceCents: number; qty: number }) =>
          sum + l.priceCents * l.qty,
        0,
      ),
    );

    const listed = await page.request.get("/account/api/cart");
    expect(await listed.json()).toEqual(body);

    const removed = await page.request.delete(
      `/account/api/cart?productId=${OFFLINE_PRODUCT_ID}`,
    );
    expect(removed.status()).toBe(200);
    expect(
      (await removed.json()).lines.some(
        (l: { productId: number }) => l.productId === OFFLINE_PRODUCT_ID,
      ),
    ).toBe(false);
  });

  test("rejects invalid input with 400", async ({ page }) => {
    await loginAsAna(page);
    for (const data of [
      { productId: 0, qty: 1 },
      { productId: 1.5, qty: 1 },
      { productId: "1", qty: 1 },
      { productId: 9999, qty: 1 },
      { productId: 1, qty: 0 },
      { productId: 1, qty: -2 },
      { productId: 1, qty: 100 },
      { productId: 1, qty: 1e6 },
    ]) {
      const response = await page.request.post("/account/api/cart", { data });
      expect(response.status(), JSON.stringify(data)).toBe(400);
    }
    const notJson = await page.request.post("/account/api/cart", {
      headers: { "content-type": "application/json" },
      data: "{",
    });
    expect(notJson.status()).toBe(400);
    for (const query of ["", "?productId=abc", "?productId=0"]) {
      const response = await page.request.delete(`/account/api/cart${query}`);
      expect(response.status(), query).toBe(400);
    }
  });
});
