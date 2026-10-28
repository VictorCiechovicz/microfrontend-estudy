import { tags } from "@lab/cache-sync";
import {
  type CartLine,
  getCart,
  getUser,
  listOrders,
  type Order,
  type User,
  withLatency,
} from "@lab/db";
import { cacheTag } from "next/cache";

export async function getProfile(userId: number): Promise<User | null> {
  "use cache";
  cacheTag(tags.userProfile(userId));
  const user = getUser(userId);
  return user && { id: user.id, name: user.name };
}

export async function getOrders(userId: number): Promise<Order[]> {
  "use cache";
  cacheTag(tags.userOrders(userId));
  return withLatency(() => listOrders(userId));
}

export async function getOrder(
  userId: number,
  orderId: number,
): Promise<Order | null> {
  "use cache";
  cacheTag(tags.userOrders(userId));
  return listOrders(userId).find((order) => order.id === orderId) ?? null;
}

export async function getCartLines(userId: number): Promise<CartLine[]> {
  "use cache";
  cacheTag(tags.userCart(userId));
  return getCart(userId);
}
