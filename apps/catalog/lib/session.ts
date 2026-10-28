import { getUser } from "@lab/db";
import { cookies } from "next/headers";

export async function getSessionUserId(): Promise<number | null> {
  const value = (await cookies()).get("lab_user")?.value;
  if (!value || !/^\d+$/.test(value)) return null;
  return getUser(Number(value))?.id ?? null;
}
