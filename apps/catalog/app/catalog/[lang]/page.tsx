import { getProduct, type Lang } from "@lab/db";
import { RemoteWidget } from "@lab/mf-host";
import { Price } from "@lab/ui";
import Link from "next/link";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const priceLang: Lang = lang === "en" ? "en" : "pt";
  const product = getProduct(1, priceLang);
  return (
    <main>
      <h1>Catalog</h1>
      <nav>
        <Link href={`/catalog/${lang}/guides`}>Guides</Link>
      </nav>
      {product ? (
        <p data-testid="featured-price">
          {product.name}: <Price cents={product.priceCents} lang={priceLang} />
        </p>
      ) : null}
      <RemoteWidget name="HelloWidget" />
    </main>
  );
}
