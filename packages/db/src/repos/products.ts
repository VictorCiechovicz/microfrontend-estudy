import { getDb } from "../client.ts";
import { consumeFault } from "../faults.ts";
import type { Lang, Product } from "../schema.ts";

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
};

const SELECT = `
SELECT p.id, p.slug, t.name, t.description, p.price_cents
FROM products p
JOIN product_translations t ON t.product_id = p.id AND t.lang = ?`;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
  };
}

export function listProducts(lang: Lang): Product[] {
  const rows = getDb()
    .prepare(`${SELECT} ORDER BY p.id`)
    .all(lang) as ProductRow[];
  return rows.map(toProduct);
}

export function getProduct(id: number, lang: Lang): Product | null {
  const row = getDb().prepare(`${SELECT} WHERE p.id = ?`).get(lang, id) as
    | ProductRow
    | undefined;
  return row ? toProduct(row) : null;
}

export function getStock(productId: number): number {
  if (consumeFault("stock")) throw new Error("Stock service unavailable");
  const row = getDb()
    .prepare("SELECT stock FROM products WHERE id = ?")
    .get(productId) as { stock: number } | undefined;
  return row?.stock ?? 0;
}

export function listReviews(
  productId: number,
): { author: string; text: string; rating: number }[] {
  return getDb()
    .prepare(
      "SELECT author, text, rating FROM reviews WHERE product_id = ? ORDER BY id",
    )
    .all(productId) as { author: string; text: string; rating: number }[];
}

export function setPrice(productId: number, priceCents: number): void {
  getDb()
    .prepare("UPDATE products SET price_cents = ? WHERE id = ?")
    .run(priceCents, productId);
}

export function getRecommendations(
  excludeProductId?: number,
  limit = 4,
  lang: Lang = "en",
): Product[] {
  const rows = getDb()
    .prepare(
      `${SELECT} WHERE p.id != ? ORDER BY p.price_cents DESC, p.id LIMIT ?`,
    )
    .all(lang, excludeProductId ?? -1, limit) as ProductRow[];
  return rows.map(toProduct);
}
