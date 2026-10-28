import { connection } from "next/server";
import { getProductStock } from "../../../../../lib/data";
import { t } from "../../../../../lib/i18n";
import styles from "./product.module.css";

export async function StockBlock({ id }: { id: number }) {
  await connection();
  const stock = await getProductStock(id);
  return (
    <p
      data-testid="stock"
      className={
        stock > 0 ? styles.stock : `${styles.stock} ${styles.stockOut}`
      }
    >
      {await t("inStock", { n: stock })}
    </p>
  );
}
