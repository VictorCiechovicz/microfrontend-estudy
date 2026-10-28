import { Card, PageHeader, Skeleton } from "@lab/ui";
import { Suspense } from "react";
import { currentLang, t } from "../../../../lib/i18n";
import { getSessionUserId } from "../../../../lib/session";
import { CatalogStudyNote } from "../../../components/CatalogStudyNote";
import styles from "../catalog.module.css";
import { PriceForm } from "./PriceForm";

export default async function AdminPage() {
  return (
    <main>
      <PageHeader
        eyebrow={await t("catalogEyebrow")}
        title={await t("priceAdmin")}
        lead={await t("adminLead")}
      />
      <CatalogStudyNote
        notes={[
          {
            slug: "cross-zone-cache",
            hash: "stale-while-revalidate-no-catálogo",
          },
          "update-tag",
        ]}
      >
        <p>
          Ponha um produto no carrinho, mude o preço dele aqui e leia o aviso de
          cache no canto: <code>revalidateTag(product:&lt;id&gt;, 'max')</code>,{" "}
          <code>revalidateTag(products:rankings, 'max')</code> e{" "}
          <code>updateTag(products)</code>.
        </p>
        <p>
          A lista do catálogo mostra o preço novo na hora (
          <code>updateTag</code>); a página do produto serve o preço antigo na
          primeira visita e o novo depois (stale-while-revalidate). Shell e
          conta recebem o broadcast, e em <code>/account/orders</code> o total
          do carrinho já reflete o preço.
        </p>
      </CatalogStudyNote>
      <Suspense fallback={<Skeleton label="…" />}>
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
      <Card className={styles.notice}>
        <p>{await t("adminLoginLead")}</p>
        <p>
          <a href={`/account/login?${next}`} className="lab-signin">
            {await t("logIn")}
          </a>
        </p>
      </Card>
    );
  }
  return (
    <Card className={styles.formCard}>
      <PriceForm
        lang={lang}
        labels={{
          productId: await t("productId"),
          priceCents: await t("priceCents"),
          priceHint: await t("priceHint"),
          updatePrice: await t("updatePrice"),
          priceUpdated: await t("priceUpdated"),
          unknownProduct: await t("unknownProduct"),
          invalidPrice: await t("invalidPrice"),
        }}
      />
    </Card>
  );
}
