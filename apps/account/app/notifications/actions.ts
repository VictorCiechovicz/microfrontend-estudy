"use server";

import { broadcastInvalidation, type CacheReport, tags } from "@lab/cache-sync";
import { markNotificationRead } from "@lab/db";
import { refresh } from "next/cache";
import { requireUserId } from "../../lib/session";

export async function markReadAction(id: number): Promise<CacheReport | null> {
  const userId = await requireUserId();
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  markNotificationRead(userId, id);
  refresh();
  const broadcastTags = [tags.userNotifications(userId)];
  const results = await broadcastInvalidation(broadcastTags, {
    from: "account",
  });
  return {
    zone: "account",
    local: [{ kind: "refresh" }],
    broadcast: { tags: broadcastTags, results },
  };
}
