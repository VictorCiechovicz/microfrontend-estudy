import { Button } from "@lab/ui";
import { navigation } from "next/cache";
import Link from "next/link";
import { getProfile } from "../../lib/data";
import { getSessionUserId } from "../../lib/session";
import { logout } from "../login/actions";

export async function UserSlot() {
  await navigation();
  const id = await getSessionUserId();
  const user = id === null ? null : await getProfile(id);
  if (!user) return <Link href="/login">Log in</Link>;
  return (
    <form action={logout}>
      <span data-testid="user-name">{user.name}</span>{" "}
      <Button type="submit" variant="ghost">
        Log out
      </Button>
    </form>
  );
}
