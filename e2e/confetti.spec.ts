import { expect, type Page, test } from "@playwright/test";

const PRODUCT_ID = 8;

async function loginAsAna(page: Page) {
  await page.goto("/account/login");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/account");
}

test("canvas-confetti is a lazy chunk fetched only after an order is placed", async ({
  page,
}) => {
  await loginAsAna(page);
  const added = await page.request.post("/account/api/cart", {
    data: { productId: PRODUCT_ID, qty: 1 },
  });
  expect(added.status()).toBe(200);
  await page.goto("/account/orders");
  await expect(
    page.getByRole("region", { name: "Histórico de pedidos" }),
  ).toBeVisible();

  const chunks: Array<{ url: string; body: Promise<string> }> = [];
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/_next/static/") && url.endsWith(".js")) {
      chunks.push({ url, body: response.text() });
    }
  });
  const initialScripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => name.endsWith(".js")),
  );
  expect(initialScripts.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Fazer pedido" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /realizado/ }),
  ).toBeVisible();

  await expect
    .poll(async () => {
      const bodies = await Promise.all(chunks.map((chunk) => chunk.body));
      return bodies.filter((body) => body.includes("confetti")).length;
    })
    .toBeGreaterThan(0);

  const loadedBefore = await Promise.all(
    initialScripts.map(async (url) => {
      const response = await page.request.get(url);
      return (await response.text()).includes("confetti");
    }),
  );
  expect(loadedBefore.some(Boolean)).toBe(false);
});
