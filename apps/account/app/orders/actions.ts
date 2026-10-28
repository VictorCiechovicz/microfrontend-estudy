"use server";

import { broadcastInvalidation, tags } from "@lab/cache-sync";
import { type Order, placeOrder } from "@lab/db";
import { updateTag } from "next/cache";
import { requireUserId } from "../../lib/session";

export async function placeOrderAction(): Promise<
  { orderId: number } | { error: "Cart is empty" }
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
  updateTag(tags.userOrders(userId));
  updateTag(tags.userCart(userId));
  updateTag(tags.userNotifications(userId));
  await broadcastInvalidation(
    [
      ...order.lines.map((line) => tags.stock(line.productId)),
      tags.userNotifications(userId),
      tags.userCart(userId),
    ],
    { from: "account" },
  );
  return { orderId: order.id };
}
