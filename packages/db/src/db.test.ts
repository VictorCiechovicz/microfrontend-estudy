import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
  addToCart,
  closeDb,
  getCart,
  getProduct,
  getStock,
  injectFault,
  listProducts,
  placeOrder,
  resetDb,
  unreadCount,
} from "./index.ts";

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
