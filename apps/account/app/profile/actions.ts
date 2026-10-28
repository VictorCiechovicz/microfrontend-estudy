"use server";

import { broadcastInvalidation, tags } from "@lab/cache-sync";
import { updateProfile } from "@lab/db";
import { updateTag } from "next/cache";
import { requireUserId } from "../../lib/session";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim() === "") return;
  updateProfile(userId, name.trim());
  updateTag(tags.userProfile(userId));
  await broadcastInvalidation([tags.userProfile(userId)], { from: "account" });
}
