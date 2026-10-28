import { Suspense } from "react";
import { requireUserId } from "../../lib/session";

export default function OrdersPage() {
  return (
    <main>
      <h1>Orders</h1>
      <Suspense fallback={null}>
        <RequireSession />
      </Suspense>
    </main>
  );
}

async function RequireSession() {
  await requireUserId();
  return null;
}
