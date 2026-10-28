import { getDb } from "../client.ts";
import type { CartLine } from "../schema.ts";

export function getCart(userId: number): CartLine[] {
  const rows = getDb()
    .prepare(
      `SELECT c.product_id, t.name, p.price_cents, c.qty
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       JOIN product_translations t ON t.product_id = p.id AND t.lang = 'en'
       WHERE c.user_id = ?
       ORDER BY c.product_id`,
    )
    .all(userId) as {
    product_id: number;
    name: string;
    price_cents: number;
    qty: number;
  }[];
  return rows.map((row) => ({
    productId: row.product_id,
    name: row.name,
    priceCents: row.price_cents,
    qty: row.qty,
  }));
}

export const MAX_LINE_QTY = 99;

export function addToCart(userId: number, productId: number, qty = 1): void {
  getDb()
    .prepare(
      `INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, MIN(?, ${MAX_LINE_QTY}))
       ON CONFLICT(user_id, product_id) DO UPDATE SET qty = MIN(qty + excluded.qty, ${MAX_LINE_QTY})`,
    )
    .run(userId, productId, qty);
}

export function removeFromCart(userId: number, productId: number): void {
  getDb()
    .prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?")
    .run(userId, productId);
}
