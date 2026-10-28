import { connection } from "next/server";
import { getProductStock } from "../../../../../lib/data";
import { t } from "../../../../../lib/i18n";

export async function StockBlock({ id }: { id: number }) {
  await connection();
  const stock = await getProductStock(id);
  return <p data-testid="stock">{await t("inStock", { n: stock })}</p>;
}
