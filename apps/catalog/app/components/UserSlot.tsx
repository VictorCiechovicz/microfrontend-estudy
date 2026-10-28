import { getUser } from "@lab/db";
import { UserChip } from "@lab/ui";
import { navigation } from "next/cache";
import { t } from "../../lib/i18n";
import { getSessionUserId } from "../../lib/session";

export async function UserSlot() {
  await navigation();
  const id = await getSessionUserId();
  const user = id === null ? null : getUser(id);
  if (!user) {
    return (
      <a href="/account/login" className="lab-signin">
        {await t("logIn")}
      </a>
    );
  }
  return <UserChip name={user.name} />;
}
