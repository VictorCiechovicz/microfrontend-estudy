import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    __marker?: number;
  }
}

const TOAST_PRODUCT_ID = 10;

async function loginAsAna(page: Page) {
  await page.goto("/account/login");
  await page.getByLabel("Ana").check();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/account");
}

async function turnStudyModeOn(page: Page) {
  const toggle = page.getByTestId("study-toggle");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("study-panel")).toBeVisible();
}

test("home has a six-step study tour linking to real places and notes", async ({
  page,
}) => {
  await page.goto("/");
  const tour = page.locator("#roteiro");
  await expect(
    tour.getByRole("heading", { level: 2, name: "Comece por aqui" }),
  ).toBeVisible();
  const steps = tour.getByTestId("study-step");
  await expect(steps).toHaveCount(6);
  for (const step of await steps.all()) {
    await expect(step.getByRole("heading", { level: 3 })).not.toBeEmpty();
    await expect(step.getByText("Faça", { exact: true })).toBeVisible();
    await expect(step.getByText("Observe", { exact: true })).toBeVisible();
    const place = await step.getByTestId("step-place").getAttribute("href");
    expect(place).toMatch(/^\/(catalog|account)\//);
    expect((await page.request.get(place ?? "")).status(), place ?? "").toBe(
      200,
    );
    const notes = step.getByTestId("step-note");
    expect(await notes.count()).toBeGreaterThan(0);
    for (const note of await notes.all()) {
      const href = await note.getAttribute("href");
      expect(href).toMatch(/^\/estudo\/[a-z0-9-]+$/);
      expect((await page.request.get(href ?? "")).status(), href ?? "").toBe(
        200,
      );
    }
  }
});

test("study panel names the zone that served each page", async ({ page }) => {
  await page.goto("/");
  await turnStudyModeOn(page);
  const zone = page.getByTestId("study-zone");
  await expect(zone).toHaveText("zona shell · :3000");

  await page.goto("/catalog/pt");
  await expect(page.getByTestId("study-panel")).toBeVisible();
  await expect(zone).toHaveText("zona catálogo · :3001");
  await expect(page.getByTestId("study-panel")).toContainText("assetPrefix");

  await page.goto("/account/login");
  await expect(zone).toHaveText("zona conta · :3002");
  await expect(page.getByTestId("study-panel")).toContainText("basePath");
});

test("soft navigation counter grows on same-zone links and resets across zones", async ({
  page,
}) => {
  await page.goto("/catalog/pt");
  await turnStudyModeOn(page);
  const count = page.getByTestId("soft-nav-count");
  await expect(count).toHaveText("0");
  await page.evaluate(() => {
    window.__marker = 1;
  });

  await page.getByRole("main").getByRole("link", { name: "Guias" }).click();
  await expect(page).toHaveURL("/catalog/pt/guides");
  await expect(count).toHaveText("1");
  await page
    .getByRole("main")
    .getByRole("link", { name: "Cuidando do seu pedido" })
    .click();
  await expect(page).toHaveURL("/catalog/pt/guides/caring-for-your-order");
  await expect(count).toHaveText("2");
  expect(await page.evaluate(() => window.__marker)).toBe(1);

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Minha conta" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-zone", "account");
  await expect(count).toHaveText("0");
  await expect(page.getByTestId("study-arrival")).toContainText(
    "você atravessou uma zona",
  );
  await expect(page.getByTestId("study-arrival")).toContainText(
    "Saiu de catálogo para conta",
  );
  expect(await page.evaluate(() => window.__marker)).toBeUndefined();
});

test("study mode outlines and labels federated widgets", async ({ page }) => {
  await page.goto("/catalog/pt/products/5");
  const widget = page.locator('[data-remote-widget="Recommendations"]');
  await expect(
    widget.getByRole("region", { name: "Recomendados" }),
  ).toBeVisible();
  expect(await widget.evaluate((el) => getComputedStyle(el).display)).toBe(
    "contents",
  );

  await turnStudyModeOn(page);
  await expect(page.locator("html")).toHaveAttribute("data-study", "on");
  await expect
    .poll(() => widget.evaluate((el) => getComputedStyle(el).outlineStyle))
    .toBe("dashed");
  expect(
    await widget.evaluate((el) => getComputedStyle(el, "::before").content),
  ).toBe('"Module Federation · widgets@:3003 · Recommendations"');
  await expect(page.getByTestId("study-widgets")).toContainText(
    "widgets/Recommendations",
  );

  await page.getByTestId("study-toggle").click();
  await expect(page.locator("html")).not.toHaveAttribute("data-study", "on");
  expect(await widget.evaluate((el) => getComputedStyle(el).display)).toBe(
    "contents",
  );
});

test("placing an order shows the local invalidations and the zones notified", async ({
  page,
}) => {
  await loginAsAna(page);
  const added = await page.request.post("/account/api/cart", {
    data: { productId: TOAST_PRODUCT_ID, qty: 1 },
  });
  expect(added.status()).toBe(200);
  await page.goto("/account/orders");
  await page.getByRole("button", { name: "Fazer pedido" }).click();

  const toast = page.getByRole("status", { name: "Eventos de cache" });
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute("data-from-zone", "account");
  await expect(toast.getByTestId("cache-toast-local")).toHaveText(
    [
      "updateTag(user:1:orders)",
      "updateTag(user:1:cart)",
      "updateTag(user:1:notifications)",
    ].join(""),
  );
  await expect(toast).toContainText(`stock:${TOAST_PRODUCT_ID}`);
  const zones = toast.getByTestId("cache-toast-zones").getByRole("listitem");
  await expect(zones).toHaveText(["shell ✓", "catálogo ✓"]);

  await toast.getByRole("button", { name: "Fechar aviso de cache" }).click();
  await expect(toast).toHaveCount(0);
});

test("study notes render in the shell with working links between notes", async ({
  page,
}) => {
  await page.goto("/estudo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Notas de estudo",
  );
  expect(await page.getByTestId("note-card").count()).toBeGreaterThanOrEqual(
    30,
  );

  await page.goto("/estudo/navigation-prefetch");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "navigation() e prefetch()",
  );
  await expect(
    page.locator("#navigation-no-catálogo-sem-efeito-observável"),
  ).toHaveText("navigation() no catálogo: sem efeito observável");
  await page
    .getByRole("article")
    .getByRole("link", { name: "isr-shell.md" })
    .click();
  await expect(page).toHaveURL("/estudo/isr-shell");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ISR");

  const missing = await page.request.get("/estudo/nope");
  expect(missing.status()).toBe(404);
});
