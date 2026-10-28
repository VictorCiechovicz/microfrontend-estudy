import { getDb } from "../client.ts";
import type { Notification } from "../schema.ts";

export function listNotifications(userId: number): Notification[] {
  const rows = getDb()
    .prepare(
      "SELECT id, user_id, text, read, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC",
    )
    .all(userId) as {
    id: number;
    user_id: number;
    text: string;
    read: number;
    created_at: string;
  }[];
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    text: row.text,
    read: row.read === 1,
    createdAt: row.created_at,
  }));
}

export function unreadCount(userId: number): number {
  const row = getDb()
    .prepare(
      "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0",
    )
    .get(userId) as { n: number };
  return row.n;
}

export function markNotificationRead(userId: number, id: number): void {
  getDb()
    .prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?")
    .run(id, userId);
}
