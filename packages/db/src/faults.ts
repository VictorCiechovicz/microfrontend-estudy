import { getDb } from "./client.ts";

export type FaultKey = "stock";

export function injectFault(key: FaultKey, count: number): void {
  getDb()
    .prepare(
      "INSERT INTO faults (key, remaining) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET remaining = excluded.remaining",
    )
    .run(key, count);
}

export function consumeFault(key: FaultKey): boolean {
  const result = getDb()
    .prepare(
      "UPDATE faults SET remaining = remaining - 1 WHERE key = ? AND remaining > 0",
    )
    .run(key);
  return Number(result.changes) > 0;
}
