import { listNotifications } from "@lab/db";
import { Button } from "@lab/ui";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireUserId } from "../../lib/session";
import { markReadAction } from "./actions";

export default function NotificationsPage() {
  return (
    <main>
      <h1>Notifications</h1>
      <Suspense fallback={<p aria-busy="true">Loading notifications…</p>}>
        <NotificationList />
      </Suspense>
    </main>
  );
}

async function NotificationList() {
  await connection();
  const userId = await requireUserId();
  const notifications = listNotifications(userId);
  if (notifications.length === 0) return <p>No notifications.</p>;
  return (
    <ul>
      {notifications.map((notification) => (
        <li key={notification.id}>
          {notification.text}{" "}
          {notification.read ? (
            <span>(read)</span>
          ) : (
            <form
              action={markReadAction.bind(null, notification.id)}
              style={{ display: "inline" }}
            >
              <Button type="submit" variant="ghost">
                Mark as read
              </Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
