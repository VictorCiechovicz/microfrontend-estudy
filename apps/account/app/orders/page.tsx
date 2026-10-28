import { EmptyState, PageHeader, Price, Skeleton, StudyNote } from "@lab/ui";
import { navigation } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { getCartLines, getOrders } from "../../lib/data";
import { requireUserId } from "../../lib/session";
import styles from "../components/account.module.css";
import { PlaceOrderButton } from "../components/PlaceOrderButton";

const DATE = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function OrdersPage() {
  return (
    <main>
      <Link href="/" className="lab-back">
        ← Minha conta
      </Link>
      <PageHeader
        eyebrow="Zona conta"
        title="Pedidos"
        lead="Revise o carrinho, faça o pedido e acompanhe o histórico."
      />
      <StudyNote
        className={styles.studyNote}
        notes={[
          {
            slug: "navigation-prefetch",
            hash: "navigation-na-conta-histórico-de-pedidos",
          },
          "update-tag",
          "offline",
          "parallel-routes",
        ]}
      >
        <p>
          Aqui o <code>navigation()</code> tem efeito: volte para Minha conta e
          clique em Pedidos. Título e carrinho aparecem na hora (vieram no
          prefetch) e o histórico mostra "Carregando pedidos…" até a navegação
          trazê-lo.
        </p>
        <p>
          Fazer pedido chama <code>updateTag</code> de pedidos, carrinho e
          notificações e avisa shell e catálogo: o aviso no canto lista as tags
          e o resultado de cada zona. Com DevTools › Network › Offline, o pedido
          fica pendente (<code>useOffline</code>) e conclui sozinho quando a
          rede volta.
        </p>
      </StudyNote>
      <div className={styles.ordersLayout}>
        <Suspense
          fallback={
            <div className={styles.panel}>
              <Skeleton label="Carregando carrinho…" />
            </div>
          }
        >
          <Cart />
        </Suspense>
        <Suspense
          fallback={
            <div className={styles.panel}>
              <Skeleton label="Carregando pedidos…" />
            </div>
          }
        >
          <OrderHistory />
        </Suspense>
      </div>
    </main>
  );
}

async function Cart() {
  const userId = await requireUserId();
  const lines = await getCartLines(userId);
  return (
    <section aria-labelledby="cart-heading" className={styles.panel}>
      <h2 id="cart-heading">Carrinho</h2>
      {lines.length === 0 ? (
        <EmptyState action={<a href="/catalog/pt">Ver catálogo →</a>}>
          Seu carrinho está vazio.
        </EmptyState>
      ) : (
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
              {lines.map((line) => (
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
              <tr data-testid="cart-total">
                <td colSpan={3}>Total</td>
                <td className="lab-num">
                  <Price
                    cents={lines.reduce(
                      (sum, line) => sum + line.priceCents * line.qty,
                      0,
                    )}
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
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
    <section aria-labelledby="history-heading" className={styles.panel}>
      <h2 id="history-heading">Histórico de pedidos</h2>
      {orders.length === 0 ? (
        <EmptyState>Nenhum pedido ainda.</EmptyState>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Data</th>
                <th scope="col" className="lab-num">
                  Itens
                </th>
                <th scope="col" className="lab-num">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} data-testid="order-row">
                  <td>
                    <Link href={`/orders/${order.id}`}>Pedido #{order.id}</Link>
                  </td>
                  <td>{DATE.format(new Date(order.createdAt))}</td>
                  <td className="lab-num">
                    {order.lines.reduce((sum, line) => sum + line.qty, 0)}
                  </td>
                  <td className="lab-num">
                    <Price cents={order.totalCents} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
