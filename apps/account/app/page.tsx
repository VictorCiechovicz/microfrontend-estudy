import { unreadCount } from "@lab/db";
import { Card, PageHeader, StudyNote } from "@lab/ui";
import Link from "next/link";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import { getCartLines, getOrders, getProfile } from "../lib/data";
import { requireUserId } from "../lib/session";
import styles from "./components/account.module.css";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

const ICON_PATHS = {
  orders: [
    "M3.3 7 12 12l8.7-5",
    "M12 22V12",
    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  ],
  profile: ["M20 21a8 8 0 0 0-16 0", "M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"],
  bell: [
    "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    "M10.3 21a1.94 1.94 0 0 0 3.4 0",
  ],
} as const;

function TileIcon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <span className={styles.tileIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        {ICON_PATHS[name].map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}

function Stat({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<span className={styles.statPending}>…</span>}>
      {children}
    </Suspense>
  );
}

export default function AccountPage() {
  return (
    <main>
      <PageHeader
        eyebrow="Zona conta"
        title="Minha conta"
        lead={
          <Stat>
            <Greeting />
          </Stat>
        }
      />
      <StudyNote
        className={styles.studyNote}
        notes={[
          {
            slug: "navigation-prefetch",
            hash: "navigation-na-conta-histórico-de-pedidos",
          },
          "partial-prefetching",
        ]}
      >
        <p>
          O link "Pedidos" usa <code>&lt;Link prefetch&gt;</code>. Com DevTools
          › Network filtrado por <code>_rsc</code>, veja os prefetches de{" "}
          <code>/account/orders</code>: sem <code>x-nextjs-prerender</code>,
          porque esta zona lê o cookie de sessão e renderiza o prefetch na hora.
        </p>
        <p>
          Os contadores dos cartões chegam por streaming, cada um no seu{" "}
          <code>&lt;Suspense&gt;</code>.
        </p>
      </StudyNote>
      <nav aria-label="Conta">
        <ul className={styles.dashboard}>
          <Card as="li" interactive className={styles.tile}>
            <TileIcon name="orders" />
            <h2>
              <Link href="/orders" prefetch>
                Pedidos
              </Link>
            </h2>
            <p className={styles.tileText}>
              Carrinho, botão de fazer pedido e histórico.
            </p>
            <p className={styles.stat}>
              <Stat>
                <OrdersStat />
              </Stat>
            </p>
          </Card>
          <Card as="li" interactive className={styles.tile}>
            <TileIcon name="profile" />
            <h2>
              <Link href="/profile">Perfil</Link>
            </h2>
            <p className={styles.tileText}>
              Seu nome aparece no header de todas as zonas.
            </p>
            <p className={styles.stat}>
              <Stat>
                <ProfileStat />
              </Stat>
            </p>
          </Card>
          <Card as="li" interactive className={styles.tile}>
            <TileIcon name="bell" />
            <h2>
              <Link href="/notifications">Notificações</Link>
            </h2>
            <p className={styles.tileText}>
              Avisos de pedidos; marcar como lida atualiza o sino no header.
            </p>
            <p className={styles.stat}>
              <Stat>
                <NotificationsStat />
              </Stat>
            </p>
          </Card>
        </ul>
      </nav>
    </main>
  );
}

async function Greeting() {
  const profile = await getProfile(await requireUserId());
  return <>Olá, {profile?.name}. Por aqui você acompanha tudo da sua conta.</>;
}

async function OrdersStat() {
  const userId = await requireUserId();
  const [orders, lines] = await Promise.all([
    getOrders(userId),
    getCartLines(userId),
  ]);
  const items = lines.reduce((sum, line) => sum + line.qty, 0);
  return (
    <>
      {plural(orders.length, "pedido", "pedidos")} ·{" "}
      {plural(items, "item no carrinho", "itens no carrinho")}
    </>
  );
}

async function ProfileStat() {
  const profile = await getProfile(await requireUserId());
  return <>Nome: {profile?.name}</>;
}

async function NotificationsStat() {
  await connection();
  const n = unreadCount(await requireUserId());
  return <>{plural(n, "não lida", "não lidas")}</>;
}
