import { Button, UserChip } from "@lab/ui";
import { navigation } from "next/cache";
import Link from "next/link";
import { getProfile } from "../../lib/data";
import { getSessionUserId } from "../../lib/session";
import { logout } from "../login/actions";
import styles from "./account.module.css";

export async function UserSlot() {
  await navigation();
  const id = await getSessionUserId();
  const user = id === null ? null : await getProfile(id);
  if (!user) {
    return (
      <Link href="/login" className="lab-signin">
        Entrar
      </Link>
    );
  }
  return (
    <form action={logout} className={styles.userForm}>
      <UserChip name={user.name} />
      <Button type="submit" variant="ghost" size="sm">
        Sair
      </Button>
    </form>
  );
}
