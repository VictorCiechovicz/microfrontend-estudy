import { getUser } from "@lab/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "lab_user";

export async function getSessionUserId(): Promise<number | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value || !/^\d+$/.test(value)) return null;
  return getUser(Number(value))?.id ?? null;
}

export async function requireUserId(): Promise<number> {
  const id = await getSessionUserId();
  if (id === null) redirect("/login");
  return id;
}
