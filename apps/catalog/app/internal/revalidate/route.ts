import { createRevalidateHandler } from "@lab/cache-sync";
import { revalidateTag } from "next/cache";

export const POST = createRevalidateHandler((tag) =>
  revalidateTag(tag, { expire: 0 }),
);
