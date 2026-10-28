import { Price } from "@lab/ui";
import { notFound } from "next/navigation";
import { getOrder } from "../../lib/data";
import { requireUserId } from "../../lib/session";
import styles from "./account.module.css";

export async function OrderDetail({
  params,
  heading: Heading,
}: {
  params: Promise<{ id: string }>;
  heading: "h1" | "h2";
}) {
  const { id } = await params;
  const userId = await requireUserId();
  if (!/^\d+$/.test(id)) notFound();
  const order = await getOrder(userId, Number(id));
  if (!order) notFound();
  return (
    <article>
      <Heading className={styles.orderTitle}>Pedido #{order.id}</Heading>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col" className="lab-num">
                Qtd.
              </th>
              <th scope="col" className="lab-num">
                Preço
              </th>
              <th scope="col" className="lab-num">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.productId}>
                <td>{line.name}</td>
                <td className="lab-num">{line.qty}</td>
                <td className="lab-num">
                  <Price cents={line.priceCents} />
                </td>
                <td className="lab-num">
                  <Price cents={line.priceCents * line.qty} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td className="lab-num">
                <Price cents={order.totalCents} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </article>
  );
}
