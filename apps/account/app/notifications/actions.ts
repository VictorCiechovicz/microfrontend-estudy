"use server";

import { broadcastInvalidation, tags } from "@lab/cache-sync";
import { markNotificationRead } from "@lab/db";
import { refresh } from "next/cache";
import { requireUserId } from "../../lib/session";

export async function markReadAction(id: number): Promise<void> {
  const userId = await requireUserId();
  if (!Number.isSafeInteger(id) || id <= 0) return;
  markNotificationRead(userId, id);
  refresh();
  await broadcastInvalidation([tags.userNotifications(userId)], {
    from: "account",
  });
}
