import { internalSecret } from "./zones";

export function createRevalidateHandler(revalidate: (tag: string) => void) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
      return Response.json({ error: "method not allowed" }, { status: 405 });
    }
    if (req.headers.get("x-lab-secret") !== internalSecret()) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const body: unknown = await req.json().catch(() => null);
    const tagList = (body as { tags?: unknown } | null)?.tags;
    if (
      !Array.isArray(tagList) ||
      !tagList.every((tag) => typeof tag === "string")
    ) {
      return Response.json({ error: "invalid body" }, { status: 400 });
    }
    for (const tag of tagList) revalidate(tag);
    return Response.json({ revalidated: tagList });
  };
}
