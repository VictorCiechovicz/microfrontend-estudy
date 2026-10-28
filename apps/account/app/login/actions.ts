"use server";

import { getUser } from "@lab/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "../../lib/session";

function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  return value;
}

export async function login(formData: FormData): Promise<void> {
  const user = getUser(Number(formData.get("userId")));
  if (!user) redirect("/login");
  (await cookies()).set(SESSION_COOKIE, String(user.id), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/" });
  redirect("/login");
}
