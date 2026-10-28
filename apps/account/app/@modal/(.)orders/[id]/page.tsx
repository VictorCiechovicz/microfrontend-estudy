import { Suspense } from "react";
import { Modal } from "../../../components/Modal";
import { OrderDetail } from "../../../components/OrderDetail";

export default function OrderModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Modal label="Order detail">
      <Suspense fallback={<p aria-busy="true">Loading order…</p>}>
        <OrderDetail params={params} heading="h2" />
      </Suspense>
    </Modal>
  );
}
