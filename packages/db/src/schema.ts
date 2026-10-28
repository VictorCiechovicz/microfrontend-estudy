import type { DatabaseSync } from "node:sqlite";

export type Lang = "pt" | "en";
export const LANGS: readonly Lang[] = ["pt", "en"];

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
};
export type CartLine = {
  productId: number;
  name: string;
  priceCents: number;
  qty: number;
};
export type Order = {
  id: number;
  userId: number;
  totalCents: number;
  createdAt: string;
  lines: CartLine[];
};
export type Notification = {
  id: number;
  userId: number;
  text: string;
  read: boolean;
  createdAt: string;
};
export type User = { id: number; name: string };

const TABLES = [
  "faults",
  "notifications",
  "order_lines",
  "orders",
  "cart_items",
  "reviews",
  "product_translations",
  "products",
  "users",
] as const;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL,
  stock INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS product_translations (
  product_id INTEGER NOT NULL REFERENCES products(id),
  lang TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (product_id, lang)
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cart_items (
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_lines (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  qty INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS faults (
  key TEXT PRIMARY KEY,
  remaining INTEGER NOT NULL
);
`;

export function createSchema(db: DatabaseSync): void {
  db.exec(SCHEMA);
}

export function dropSchema(db: DatabaseSync): void {
  for (const table of TABLES) db.exec(`DROP TABLE IF EXISTS ${table}`);
}
