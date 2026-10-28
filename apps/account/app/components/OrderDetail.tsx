import { Price } from "@lab/ui";
import { notFound } from "next/navigation";
import { getOrder } from "../../lib/data";
import { requireUserId } from "../../lib/session";

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
      <Heading>Order #{order.id}</Heading>
      <ul>
        {order.lines.map((line) => (
          <li key={line.productId}>
            {line.qty} × {line.name} <Price cents={line.priceCents} lang="en" />
          </li>
        ))}
      </ul>
      <p>
        Total <Price cents={order.totalCents} lang="en" />
      </p>
    </article>
  );
}
