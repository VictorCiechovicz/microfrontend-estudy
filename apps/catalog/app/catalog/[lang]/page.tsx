import type { Lang } from "@lab/db/langs";
import { RemoteWidget } from "@lab/mf-host";
import { Card, PageHeader, Price } from "@lab/ui";
import Link from "next/link";
import { ViewTransition } from "react";
import { getProductList } from "../../../lib/data";
import { currentLang, t } from "../../../lib/i18n";
import { CatalogStudyNote } from "../../components/CatalogStudyNote";
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
        <CatalogStudyNote
          notes={["partial-prefetching", "view-transitions", "root-params"]}
        >
          <p>
            Cada card usa <code>&lt;Link prefetch&gt;</code>. Com DevTools ›
            Network filtrado por <code>_rsc</code>, surgem uma requisição{" "}
            <code>/_tree</code> e um <code>__PAGE__</code> por produto (header{" "}
            <code>next-router-segment-prefetch</code>) antes de qualquer clique.
          </p>
          <p>
            Clique num produto: a navegação é suave (o contador do modo estudo
            sobe) e o nome desliza até o título, uma View Transition do tipo{" "}
            <code>slide</code>. O idioma vem do root param <code>[lang]</code>,
            lido com <code>await lang()</code> sem receber prop.
          </p>
        </CatalogStudyNote>
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
