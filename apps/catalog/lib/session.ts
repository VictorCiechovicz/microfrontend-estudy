import { cookies } from "next/headers";

export async function getSessionUserId(): Promise<number | null> {
  const id = Number((await cookies()).get("lab_user")?.value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
