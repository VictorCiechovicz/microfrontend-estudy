import { Price } from "@lab/ui";
import { navigation } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { getCartLines, getOrders } from "../../lib/data";
import { requireUserId } from "../../lib/session";
import { PlaceOrderButton } from "../components/PlaceOrderButton";

export default function OrdersPage() {
  return (
    <main>
      <h1>Orders</h1>
      <Suspense fallback={<p aria-busy="true">Loading cart…</p>}>
        <Cart />
      </Suspense>
      <Suspense fallback={<p aria-busy="true">Loading orders…</p>}>
        <OrderHistory />
      </Suspense>
    </main>
  );
}

async function Cart() {
  const userId = await requireUserId();
  const lines = await getCartLines(userId);
  return (
    <section aria-labelledby="cart-heading">
      <h2 id="cart-heading">Cart</h2>
      {lines.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {lines.map((line) => (
              <li key={line.productId}>
                {line.qty} × {line.name} <Price cents={line.priceCents} />
              </li>
            ))}
          </ul>
          <p data-testid="cart-total">
            Total{" "}
            <Price
              cents={lines.reduce(
                (sum, line) => sum + line.priceCents * line.qty,
                0,
              )}
            />
          </p>
        </>
      )}
      <PlaceOrderButton />
    </section>
  );
}

async function OrderHistory() {
  const userId = await requireUserId();
  await navigation();
  const orders = await getOrders(userId);
  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading">Order history</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id} data-testid="order-row">
              <Link href={`/orders/${order.id}`}>Order #{order.id}</Link>{" "}
              <Price cents={order.totalCents} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
