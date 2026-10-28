import { internalSecret, ZONE_REVALIDATE_URLS, type ZoneName } from "./zones";

export type BroadcastResult = { zone: ZoneName; ok: boolean; error?: string };

export async function broadcastInvalidation(
  tags: string[],
  opts: { from: ZoneName },
): Promise<BroadcastResult[]> {
  const targets = (Object.keys(ZONE_REVALIDATE_URLS) as ZoneName[]).filter(
    (zone) => zone !== opts.from,
  );
  const settled = await Promise.allSettled(
    targets.map(async (zone) => {
      const res = await fetch(ZONE_REVALIDATE_URLS[zone], {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-lab-secret": internalSecret(),
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(2000),
      });
      await res.body?.cancel();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
  );
  return settled.map((result, i): BroadcastResult => {
    const zone = targets[i] as ZoneName;
    if (result.status === "fulfilled") return { zone, ok: true };
    const error =
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
    console.warn(`cache-sync: broadcast to ${zone} failed: ${error}`);
    return { zone, ok: false, error };
  });
}
