import { prefetch } from "next/cache";
import Link from "next/link";
import { getPopularProducts } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";
import { ProductTile } from "../../../../components/ProductTile";
import styles from "./product.module.css";

export async function Popular() {
  await prefetch();
  const lang = await currentLang();
  const products = await getPopularProducts(lang);
  return (
    <section aria-labelledby="popular-heading" className={styles.section}>
      <h2 id="popular-heading">{await t("popular")}</h2>
      <ul className={styles.linkGrid}>
        {products.map((product) => (
          <li key={product.id} className={styles.linkCard}>
            <ProductTile id={product.id} />
            <Link href={`/catalog/${lang}/products/${product.id}`}>
              {product.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
