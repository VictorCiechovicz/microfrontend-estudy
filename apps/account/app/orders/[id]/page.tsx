import { Suspense } from "react";
import { OrderDetail } from "../../components/OrderDetail";

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main>
      <Suspense fallback={<p aria-busy="true">Loading order…</p>}>
        <OrderDetail params={params} heading="h1" />
      </Suspense>
    </main>
  );
}
