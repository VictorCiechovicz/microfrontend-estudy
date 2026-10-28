import { broadcastInvalidation, type CacheReport, tags } from "@lab/cache-sync";
import {
  addToCart,
  type CartLine,
  getCart,
  getProduct,
  MAX_LINE_QTY,
  removeFromCart,
} from "@lab/db";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getSessionUserId } from "../../../lib/session";

type CartBody = { lines: CartLine[]; totalCents: number };

function cartOf(
  userId: number,
  cache?: CacheReport,
): NextResponse<CartBody & { cache?: CacheReport }> {
  const lines = getCart(userId);
  const totalCents = lines.reduce(
    (sum, line) => sum + line.priceCents * line.qty,
    0,
  );
  return NextResponse.json(
    cache ? { lines, totalCents, cache } : { lines, totalCents },
  );
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function parseProductId(value: unknown): number | null {
  return isPositiveInt(value) && getProduct(value, "en") ? value : null;
}

const unauthenticated = () =>
  NextResponse.json({ error: "unauthenticated" }, { status: 401 });
const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

async function invalidateCart(userId: number): Promise<CacheReport> {
  const tag = tags.userCart(userId);
  revalidateTag(tag, { expire: 0 });
  const results = await broadcastInvalidation([tag], { from: "account" });
  return {
    zone: "account",
    local: [{ kind: "revalidateTag", tag, profile: "{ expire: 0 }" }],
    broadcast: { tags: [tag], results },
  };
}

export async function GET() {
  const userId = await getSessionUserId();
  if (userId === null) return unauthenticated();
  return cartOf(userId);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) return unauthenticated();
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return badRequest("invalid body");
  }
  const { productId, qty } = body as { productId?: unknown; qty?: unknown };
  const id = parseProductId(productId);
  if (id === null) return badRequest("invalid productId");
  if (!isPositiveInt(qty) || qty > MAX_LINE_QTY) {
    return badRequest("invalid qty");
  }
  addToCart(userId, id, qty);
  return cartOf(userId, await invalidateCart(userId));
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (userId === null) return unauthenticated();
  const raw = new URL(request.url).searchParams.get("productId") ?? "";
  const id = parseProductId(/^\d+$/.test(raw) ? Number(raw) : null);
  if (id === null) return badRequest("invalid productId");
  removeFromCart(userId, id);
  return cartOf(userId, await invalidateCart(userId));
}
