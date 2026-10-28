import type { BroadcastResult } from "./broadcast";
import type { ZoneName } from "./zones";

export type LocalInvalidation =
  | { kind: "updateTag"; tag: string }
  | { kind: "revalidateTag"; tag: string; profile: string }
  | { kind: "refresh" };

export type CacheReport = {
  zone: ZoneName;
  local: LocalInvalidation[];
  broadcast: { tags: string[]; results: BroadcastResult[] };
};
