"use server";

import { getUser } from "@lab/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "../../lib/session";

function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  if ([...value].some((char) => char.charCodeAt(0) < 0x20)) return "/";
  return value;
}

const SHELL_URL = process.env.SHELL_URL ?? "http://localhost:3000";

function isOutsideAccountZone(path: string): boolean {
  return /^\/catalog(?:[/?#]|$)/.test(path);
}

export async function login(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  const user = getUser(Number(formData.get("userId")));
  if (!user) redirect(`/login?${new URLSearchParams({ next })}`);
  (await cookies()).set(SESSION_COOKIE, String(user.id), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect(isOutsideAccountZone(next) ? `${SHELL_URL}${next}` : next);
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/" });
  redirect("/login");
}
