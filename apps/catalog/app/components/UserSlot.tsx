import { getUser } from "@lab/db";
import { navigation } from "next/cache";
import { getSessionUserId } from "../../lib/session";

export async function UserSlot() {
  await navigation();
  const id = await getSessionUserId();
  const user = id === null ? null : getUser(id);
  if (!user) return <a href="/account/login">Log in</a>;
  return <span data-testid="user-name">{user.name}</span>;
}
