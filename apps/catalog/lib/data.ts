import { tags } from "@lab/cache-sync";
import {
  getProduct,
  getRecommendations,
  getStock,
  listProducts,
  type Product,
  withLatency,
} from "@lab/db";
import { isLang } from "@lab/db/langs";
import { cacheLife, cacheTag } from "next/cache";
import { lang } from "next/root-params";

export async function getProductList(): Promise<Product[]> {
  "use cache";
  cacheTag(tags.products());
  cacheLife("hours");
  const value = await lang();
  return isLang(value) ? withLatency(() => listProducts(value)) : [];
}

export async function getProductDetail(id: number): Promise<Product | null> {
  "use cache";
  cacheTag(tags.product(id));
  cacheLife("hours");
  const value = await lang();
  return isLang(value) ? withLatency(() => getProduct(id, value)) : null;
}

export async function getProductStock(id: number): Promise<number> {
  "use cache";
  cacheTag(tags.stock(id));
  cacheLife("minutes");
  return withLatency(() => getStock(id));
}

export async function getRelatedProducts(id?: number): Promise<Product[]> {
  "use cache";
  cacheTag(tags.products());
  cacheLife("hours");
  return withLatency(() => getRecommendations(id));
}

export async function getPopularProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(tags.products());
  cacheLife("hours");
  return withLatency(() => getRecommendations(undefined, 3));
}
