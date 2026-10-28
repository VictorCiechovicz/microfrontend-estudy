import Link from "next/link";
import { getRelatedProducts } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";
import { ProductTile } from "../../../../components/ProductTile";
import styles from "./product.module.css";

export async function Related({ id }: { id: number }) {
  const lang = await currentLang();
  const products = await getRelatedProducts(id, lang);
  return (
    <section aria-labelledby="related-heading" className={styles.section}>
      <h2 id="related-heading">{await t("related")}</h2>
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
