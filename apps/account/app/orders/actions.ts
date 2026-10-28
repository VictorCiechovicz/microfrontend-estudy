"use server";

import { broadcastInvalidation, type CacheReport, tags } from "@lab/cache-sync";
import { type Order, placeOrder } from "@lab/db";
import { updateTag } from "next/cache";
import { requireUserId } from "../../lib/session";

export async function placeOrderAction(): Promise<
  { orderId: number; cache: CacheReport } | { error: "Cart is empty" }
> {
  const userId = await requireUserId();
  let order: Order;
  try {
    order = placeOrder(userId);
  } catch (error) {
    if (error instanceof Error && error.message === "Cart is empty") {
      return { error: "Cart is empty" };
    }
    throw error;
  }
  const localTags = [
    tags.userOrders(userId),
    tags.userCart(userId),
    tags.userNotifications(userId),
  ];
  for (const tag of localTags) updateTag(tag);
  const broadcastTags = [
    ...order.lines.map((line) => tags.stock(line.productId)),
    tags.userNotifications(userId),
    tags.userCart(userId),
  ];
  const results = await broadcastInvalidation(broadcastTags, {
    from: "account",
  });
  return {
    orderId: order.id,
    cache: {
      zone: "account",
      local: localTags.map((tag) => ({ kind: "updateTag", tag })),
      broadcast: { tags: broadcastTags, results },
    },
  };
}
