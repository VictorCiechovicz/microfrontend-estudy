import { getDb } from "../client.ts";
import type { CartLine, Order } from "../schema.ts";
import { getCart } from "./cart.ts";

type OrderRow = {
  id: number;
  user_id: number;
  total_cents: number;
  created_at: string;
};

function linesOf(orderId: number): CartLine[] {
  const rows = getDb()
    .prepare(
      "SELECT product_id, name, price_cents, qty FROM order_lines WHERE order_id = ? ORDER BY product_id",
    )
    .all(orderId) as {
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

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    lines: linesOf(row.id),
  };
}

export function placeOrder(userId: number): Order {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const lines = getCart(userId);
    if (lines.length === 0) throw new Error("Cart is empty");
    const totalCents = lines.reduce((sum, l) => sum + l.priceCents * l.qty, 0);
    const createdAt = new Date().toISOString();
    const { lastInsertRowid } = db
      .prepare(
        "INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, ?, ?)",
      )
      .run(userId, totalCents, createdAt);
    const orderId = Number(lastInsertRowid);
    const addLine = db.prepare(
      "INSERT INTO order_lines (order_id, product_id, name, price_cents, qty) VALUES (?, ?, ?, ?, ?)",
    );
    const decrement = db.prepare(
      "UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?",
    );
    for (const line of lines) {
      addLine.run(
        orderId,
        line.productId,
        line.name,
        line.priceCents,
        line.qty,
      );
      decrement.run(line.qty, line.productId);
    }
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
    db.prepare(
      "INSERT INTO notifications (user_id, text, read, created_at) VALUES (?, ?, 0, ?)",
    ).run(userId, `Order #${orderId} placed`, createdAt);
    db.exec("COMMIT");
    return { id: orderId, userId, totalCents, createdAt, lines };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function listOrders(userId: number): Order[] {
  const rows = getDb()
    .prepare(
      "SELECT id, user_id, total_cents, created_at FROM orders WHERE user_id = ? ORDER BY id DESC",
    )
    .all(userId) as OrderRow[];
  return rows.map(toOrder);
}
