import Link from "next/link";
import { getRelatedProducts } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";

export async function Related({ id }: { id: number }) {
  const lang = await currentLang();
  const products = await getRelatedProducts(id);
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading">{await t("related")}</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <Link href={`/catalog/${lang}/products/${product.id}`}>
              {product.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
