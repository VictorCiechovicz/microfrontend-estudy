import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
  addToCart,
  closeDb,
  getCart,
  getProduct,
  getRecommendations,
  getStock,
  injectFault,
  listProducts,
  placeOrder,
  resetDb,
  setPrice,
  unreadCount,
} from "./index.ts";
import { isLang } from "./langs.ts";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "lab-db-"));
  process.env.LAB_DB_PATH = join(dir, "nested", "test.sqlite");
  resetDb();
});

afterEach(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

test("seed creates 12 products translated", () => {
  expect(listProducts("pt")).toHaveLength(12);
  expect(getProduct(1, "en")?.name).toBe("Product 1");
  expect(getProduct(1, "pt")?.name).toBe("Produto 1");
});

test("placeOrder decrements stock, clears cart and notifies", () => {
  addToCart(1, 3, 2);
  const o = placeOrder(1);
  expect(getStock(3)).toBe(3);
  expect(getCart(1)).toEqual([]);
  expect(o.totalCents).toBe(2 * (getProduct(3, "en")?.priceCents ?? 0));
  expect(unreadCount(1)).toBe(2);
});

test("cart and order lines use the Portuguese product name", () => {
  addToCart(1, 3, 1);
  expect(getCart(1)).toMatchObject([{ productId: 3, name: "Produto 3" }]);
  expect(placeOrder(1).lines).toMatchObject([{ name: "Produto 3" }]);
});

test("addToCart clamps a line at 99 units", () => {
  addToCart(1, 3, 60);
  addToCart(1, 3, 60);
  expect(getCart(1)).toMatchObject([{ productId: 3, qty: 99 }]);
  addToCart(1, 4, Number.MAX_SAFE_INTEGER);
  addToCart(1, 4, Number.MAX_SAFE_INTEGER);
  expect(getCart(1)).toMatchObject([
    { productId: 3, qty: 99 },
    { productId: 4, qty: 99 },
  ]);
});

test("placeOrder on empty cart throws", () => {
  expect(() => placeOrder(2)).toThrow("Cart is empty");
});

test("injected stock fault fails once then recovers", () => {
  injectFault("stock", 1);
  expect(() => getStock(1)).toThrow("Stock service unavailable");
  expect(getStock(1)).toBe(5);
});

test("getProduct unknown id returns null", () => {
  expect(getProduct(9999, "pt")).toBeNull();
});

test("isLang accepts only supported languages", () => {
  expect(isLang("pt")).toBe(true);
  expect(isLang("en")).toBe(true);
  expect(isLang("xx")).toBe(false);
  expect(isLang(undefined)).toBe(false);
});

test("getRecommendations names products in the requested language", () => {
  const products = getRecommendations(5, 4, "pt");
  expect(products).toHaveLength(4);
  expect(products.map((p) => p.id)).not.toContain(5);
  for (const product of products) {
    expect(product.name).toBe(`Produto ${product.id}`);
  }
  expect(getRecommendations(5)[0]?.name).toMatch(/^Product \d+$/);
});

test("a fresh database file is seeded on first open", () => {
  closeDb();
  process.env.LAB_DB_PATH = join(dir, "fresh", "fresh.sqlite");
  expect(listProducts("en")).toHaveLength(12);
  expect(getProduct(1, "pt")?.name).toBe("Produto 1");
});

test("resetDb still restores the seed after changes", () => {
  setPrice(1, 99);
  resetDb();
  expect(getProduct(1, "en")?.priceCents).toBe(1100);
});
