import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "lab_user";

export async function getSessionUserId(): Promise<number | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function requireUserId(): Promise<number> {
  const id = await getSessionUserId();
  if (id === null) redirect("/login");
  return id;
}
