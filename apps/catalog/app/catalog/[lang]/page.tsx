import { RemoteWidget } from "@lab/mf-host";
import { Price } from "@lab/ui";
import Link from "next/link";
import { getProductList } from "../../../lib/data";
import { currentLang, t } from "../../../lib/i18n";

export default async function CatalogPage() {
  const lang = await currentLang();
  const [featured, ...rest] = await getProductList();
  return (
    <main>
      <h1>{await t("catalog")}</h1>
      <nav>
        <Link href={`/catalog/${lang}/guides`}>Guides</Link>
      </nav>
      {featured ? (
        <p data-testid="featured-price">
          <Link href={`/catalog/${lang}/products/${featured.id}`}>
            {featured.name}
          </Link>
          : <Price cents={featured.priceCents} lang={lang} />
        </p>
      ) : null}
      <ul>
        {rest.map((product) => (
          <li key={product.id}>
            <Link href={`/catalog/${lang}/products/${product.id}`}>
              {product.name}
            </Link>{" "}
            <Price cents={product.priceCents} lang={lang} />
          </li>
        ))}
      </ul>
      <RemoteWidget name="HelloWidget" />
    </main>
  );
}
