export type ZoneName = "shell" | "catalog" | "account";

function zoneUrl(value: string | undefined, fallback: string): string {
  return (value || fallback).replace(/\/$/, "");
}

export const ZONE_REVALIDATE_URLS: Record<ZoneName, string> = {
  shell: `${zoneUrl(process.env.SHELL_URL, "http://localhost:3000")}/internal/revalidate`,
  catalog: `${zoneUrl(process.env.CATALOG_URL, "http://localhost:3001")}/internal/revalidate`,
  account: `${zoneUrl(process.env.ACCOUNT_URL, "http://localhost:3002")}/account/internal/revalidate`,
};

export function internalSecret(): string {
  return process.env.LAB_INTERNAL_SECRET || "lab-dev-secret";
}
