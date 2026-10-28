import { listNotifications } from "@lab/db";
import { Button, EmptyState, PageHeader, Skeleton } from "@lab/ui";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireUserId } from "../../lib/session";
import styles from "../components/account.module.css";
import { markReadAction } from "./actions";

const DATE = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function NotificationsPage() {
  return (
    <main>
      <Link href="/" className="lab-back">
        ← Minha conta
      </Link>
      <PageHeader
        eyebrow="Zona conta"
        title="Notificações"
        lead="Marcar uma notificação como lida atualiza o contador do sino no header sem recarregar a página."
      />
      <Suspense fallback={<Skeleton label="Carregando notificações…" />}>
        <NotificationList />
      </Suspense>
    </main>
  );
}

async function NotificationList() {
  await connection();
  const userId = await requireUserId();
  const notifications = listNotifications(userId);
  if (notifications.length === 0) {
    return <EmptyState>Nenhuma notificação.</EmptyState>;
  }
  return (
    <ul className={styles.notifications}>
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={
            notification.read
              ? styles.notification
              : `${styles.notification} ${styles.unread}`
          }
          data-read={notification.read ? "true" : "false"}
        >
          <span className={styles.notificationDot} aria-hidden="true" />
          <div className={styles.notificationText}>
            <p>{notification.text}</p>
            <time dateTime={notification.createdAt}>
              {DATE.format(new Date(notification.createdAt))}
            </time>
          </div>
          {notification.read ? (
            <span className={styles.readTag}>Lida</span>
          ) : (
            <form action={markReadAction.bind(null, notification.id)}>
              <Button type="submit" variant="secondary" size="sm">
                Marcar como lida
              </Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
