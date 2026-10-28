import { Skeleton } from "@lab/ui";
import { Suspense } from "react";
import { Modal } from "../../../components/Modal";
import { OrderDetail } from "../../../components/OrderDetail";

export default function OrderModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Modal label="Detalhe do pedido">
      <Suspense fallback={<Skeleton label="Carregando pedido…" />}>
        <OrderDetail params={params} heading="h2" />
      </Suspense>
    </Modal>
  );
}
