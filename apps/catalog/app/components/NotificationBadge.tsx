import { Badge } from "@lab/ui";
import { getUnreadCount } from "../../lib/data";
import { getSessionUserId } from "../../lib/session";

export async function NotificationBadge() {
  const userId = await getSessionUserId();
  if (userId === null) return null;
  return (
    <a href="/account/notifications">
      <Badge
        count={await getUnreadCount(userId)}
        label="unread notifications"
      />
    </a>
  );
}
