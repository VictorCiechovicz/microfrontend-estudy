import { unreadCount } from "@lab/db";
import { Badge } from "@lab/ui";
import Link from "next/link";
import { connection } from "next/server";
import { getSessionUserId } from "../../lib/session";

export async function NotificationBadge() {
  await connection();
  const userId = await getSessionUserId();
  if (userId === null) return null;
  return (
    <Link href="/notifications">
      <Badge count={unreadCount(userId)} label="unread notifications" />
    </Link>
  );
}
