import { injectFault } from "@lab/db";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isStockFault(body)) {
    return Response.json(
      { error: "Expected { key: 'stock', count: integer from 1 to 100 }" },
      { status: 400 },
    );
  }
  injectFault(body.key, body.count);
  return Response.json({ key: body.key, count: body.count });
}

function isStockFault(body: unknown): body is { key: "stock"; count: number } {
  if (typeof body !== "object" || body === null) return false;
  const { key, count } = body as { key?: unknown; count?: unknown };
  return (
    key === "stock" &&
    Number.isInteger(count) &&
    (count as number) > 0 &&
    (count as number) <= 100
  );
}
