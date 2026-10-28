import { expect, test } from "@playwright/test";

const COPY = {
  pt: {
    title: "Laboratório de erros",
    notice: "Disponível apenas em next dev.",
  },
  en: { title: "Error lab", notice: "Only available in next dev." },
} as const;

for (const lang of ["pt", "en"] as const) {
  test(`error lab shows the dev-only notice in ${lang}`, async ({ page }) => {
    await page.goto(`/catalog/${lang}/lab/errors`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      COPY[lang].title,
    );
    await expect(page.getByRole("main")).toContainText(COPY[lang].notice);
    await expect(page.getByRole("button")).toHaveCount(0);
  });
}

test("error lab ignores ?mismatch=1 in production", async ({ page }) => {
  await page.goto("/catalog/pt/lab/errors?mismatch=1");
  await expect(page.getByRole("main")).toContainText(COPY.pt.notice);
  await expect(page.getByText("Rendered at")).toHaveCount(0);
});
