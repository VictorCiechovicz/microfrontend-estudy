import { NotificationBell } from "@lab/ui";
import { getUnreadCount } from "../../lib/data";
import { getSessionUserId } from "../../lib/session";

export async function NotificationBadge() {
  const userId = await getSessionUserId();
  if (userId === null) return null;
  return (
    <a href="/account/notifications">
      <NotificationBell count={await getUnreadCount(userId)} />
    </a>
  );
}
