export type ZoneName = "shell" | "catalog" | "account";

export const ZONE_REVALIDATE_URLS: Record<ZoneName, string> = {
  shell: "http://localhost:3000/internal/revalidate",
  catalog: "http://localhost:3001/internal/revalidate",
  account: "http://localhost:3002/account/internal/revalidate",
};

export function internalSecret(): string {
  return process.env.LAB_INTERNAL_SECRET || "lab-dev-secret";
}
