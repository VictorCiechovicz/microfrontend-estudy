import { Card, Skeleton } from "@lab/ui";
import Link from "next/link";
import { Suspense } from "react";
import { OrderDetail } from "../../components/OrderDetail";

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main>
      <Link href="/orders" className="lab-back">
        ← Pedidos
      </Link>
      <Card>
        <Suspense fallback={<Skeleton label="Carregando pedido…" />}>
          <OrderDetail params={params} heading="h1" />
        </Suspense>
      </Card>
    </main>
  );
}
