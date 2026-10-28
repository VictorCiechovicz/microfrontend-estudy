import type { Lang } from "@lab/db/langs";
import { RemoteWidget } from "@lab/mf-host";
import { Card, PageHeader, Price } from "@lab/ui";
import Link from "next/link";
import { ViewTransition } from "react";
import { getProductList } from "../../../lib/data";
import { currentLang, t } from "../../../lib/i18n";
import { ProductTile } from "../../components/ProductTile";
import styles from "./catalog.module.css";
import { SlideTransition } from "./SlideTransition";

function ProductLink({
  lang,
  id,
  name,
}: {
  lang: Lang;
  id: number;
  name: string;
}) {
  return (
    <Link
      href={`/catalog/${lang}/products/${id}`}
      prefetch
      transitionTypes={["slide"]}
    >
      <ViewTransition name={`product-${id}`}>
        <span>{name}</span>
      </ViewTransition>
    </Link>
  );
}

export default async function CatalogPage() {
  const lang = await currentLang();
  const [featured, ...rest] = await getProductList();
  return (
    <SlideTransition>
      <main>
        <PageHeader
          eyebrow={await t("catalogEyebrow")}
          title={await t("catalog")}
          lead={await t("catalogLead")}
          actions={
            <nav className={styles.subnav} aria-label={await t("catalog")}>
              <Link href={`/catalog/${lang}/guides`}>{await t("guides")}</Link>
              <Link href={`/catalog/${lang}/admin`}>
                {await t("priceAdmin")}
              </Link>
              <Link href={`/catalog/${lang}/lab/errors`}>
                {await t("errorLab")}
              </Link>
            </nav>
          }
        />
        {featured ? (
          <Card
            interactive
            className={styles.featured}
            data-testid="featured-price"
          >
            <ProductTile id={featured.id} />
            <div className={styles.featuredText}>
              <span className={styles.tag}>{await t("featured")}</span>
              <h2 className={styles.featuredName}>
                <ProductLink
                  lang={lang}
                  id={featured.id}
                  name={featured.name}
                />
              </h2>
              <Price cents={featured.priceCents} lang={lang} />
            </div>
          </Card>
        ) : null}
        <h2 className={styles.gridHeading}>{await t("allProducts")}</h2>
        <ul className={styles.grid}>
          {rest.map((product) => (
            <Card as="li" interactive key={product.id}>
              <ProductTile id={product.id} />
              <h3 className={styles.cardName}>
                <ProductLink lang={lang} id={product.id} name={product.name} />
              </h3>
              <Price cents={product.priceCents} lang={lang} />
            </Card>
          ))}
        </ul>
        <div className={styles.widgetRow}>
          <RemoteWidget name="HelloWidget" />
        </div>
      </main>
    </SlideTransition>
  );
}
