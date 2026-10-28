import { Suspense } from "react";
import { currentLang, t } from "../../../../lib/i18n";
import { getSessionUserId } from "../../../../lib/session";
import { PriceForm } from "./PriceForm";

export default async function AdminPage() {
  return (
    <main>
      <h1>{await t("priceAdmin")}</h1>
      <Suspense fallback={<p aria-busy="true">…</p>}>
        <AdminGate />
      </Suspense>
    </main>
  );
}

async function AdminGate() {
  const lang = await currentLang();
  if ((await getSessionUserId()) === null) {
    const next = new URLSearchParams({ next: `/catalog/${lang}/admin` });
    return (
      <p>
        <a href={`/account/login?${next}`}>{await t("logIn")}</a>
      </p>
    );
  }
  return (
    <PriceForm
      lang={lang}
      labels={{
        productId: await t("productId"),
        priceCents: await t("priceCents"),
        updatePrice: await t("updatePrice"),
        priceUpdated: await t("priceUpdated"),
        unknownProduct: await t("unknownProduct"),
        invalidPrice: await t("invalidPrice"),
      }}
    />
  );
}
