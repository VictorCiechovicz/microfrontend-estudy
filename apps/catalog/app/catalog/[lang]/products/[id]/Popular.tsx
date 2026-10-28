import { prefetch } from "next/cache";
import Link from "next/link";
import { getPopularProducts } from "../../../../../lib/data";
import { currentLang } from "../../../../../lib/i18n";

export async function Popular() {
  await prefetch();
  const lang = await currentLang();
  const products = await getPopularProducts();
  return (
    <section aria-labelledby="popular-heading">
      <h2 id="popular-heading">Popular</h2>
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
