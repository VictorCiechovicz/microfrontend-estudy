"use server";

import { broadcastInvalidation, type CacheReport, tags } from "@lab/cache-sync";
import { updateProfile } from "@lab/db";
import { updateTag } from "next/cache";
import { requireUserId } from "../../lib/session";

export async function updateProfileAction(
  formData: FormData,
): Promise<CacheReport | null> {
  const userId = await requireUserId();
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim() === "") return null;
  updateProfile(userId, name.trim());
  const tag = tags.userProfile(userId);
  updateTag(tag);
  const results = await broadcastInvalidation([tag], { from: "account" });
  return {
    zone: "account",
    local: [{ kind: "updateTag", tag }],
    broadcast: { tags: [tag], results },
  };
}
