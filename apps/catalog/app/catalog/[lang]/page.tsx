import type { Lang } from "@lab/db/langs";
import { RemoteWidget } from "@lab/mf-host";
import { Price } from "@lab/ui";
import Link from "next/link";
import { ViewTransition } from "react";
import { getProductList } from "../../../lib/data";
import { currentLang, t } from "../../../lib/i18n";
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
        <h1>{await t("catalog")}</h1>
        <nav>
          <Link href={`/catalog/${lang}/guides`}>Guides</Link>
        </nav>
        {featured ? (
          <p data-testid="featured-price">
            <ProductLink lang={lang} id={featured.id} name={featured.name} />:{" "}
            <Price cents={featured.priceCents} lang={lang} />
          </p>
        ) : null}
        <ul>
          {rest.map((product) => (
            <li key={product.id}>
              <ProductLink lang={lang} id={product.id} name={product.name} />{" "}
              <Price cents={product.priceCents} lang={lang} />
            </li>
          ))}
        </ul>
        <RemoteWidget name="HelloWidget" />
      </main>
    </SlideTransition>
  );
}
