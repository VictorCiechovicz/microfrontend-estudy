import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { broadcastInvalidation, createRevalidateHandler, tags } from "./index";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("LAB_INTERNAL_SECRET", "lab-dev-secret");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const request = (init: RequestInit & { secret?: string | null } = {}) => {
  const { secret = "lab-dev-secret", ...rest } = init;
  const headers: Record<string, string> = {};
  if (secret !== null) headers["x-lab-secret"] = secret;
  return new Request("http://localhost/internal/revalidate", {
    method: "POST",
    headers,
    ...rest,
  });
};

test("tags build the documented vocabulary", () => {
  expect(tags.stock(1)).toBe("stock:1");
  expect(tags.userCart(7)).toBe("user:7:cart");
  expect(tags.productRankings()).toBe("products:rankings");
});

test("broadcast skips the origin zone", async () => {
  const result = await broadcastInvalidation(["stock:1"], { from: "account" });
  const urls = fetchMock.mock.calls.map((c) => c[0]);
  expect(urls).toEqual([
    "http://localhost:3000/internal/revalidate",
    "http://localhost:3001/internal/revalidate",
  ]);
  expect(result.map((r) => r.zone)).toEqual(["shell", "catalog"]);
  expect(result.every((r) => r.ok)).toBe(true);
});

test("broadcast never throws when a zone is down", async () => {
  fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
  const r = await broadcastInvalidation(["stock:1"], { from: "account" });
  expect(r.find((x) => !x.ok)?.error).toMatch("ECONNREFUSED");
  expect(r.find((x) => x.ok)).toBeDefined();
  expect(console.warn).toHaveBeenCalledTimes(1);
});

test("broadcast reports non-2xx responses as failures", async () => {
  fetchMock.mockResolvedValueOnce(new Response("no", { status: 401 }));
  const r = await broadcastInvalidation(["stock:1"], { from: "shell" });
  expect(r.find((x) => !x.ok)?.error).toMatch("401");
});

test("handler rejects wrong secret with 401", async () => {
  const handler = createRevalidateHandler(vi.fn());
  const res = await handler(
    request({ secret: "nope", body: JSON.stringify({ tags: ["a"] }) }),
  );
  expect(res.status).toBe(401);
});

test("handler rejects body without tags array with 400", async () => {
  const handler = createRevalidateHandler(vi.fn());
  const res = await handler(request({ body: JSON.stringify({ tags: "a" }) }));
  expect(res.status).toBe(400);
  const bad = await handler(request({ body: "not json" }));
  expect(bad.status).toBe(400);
});

test("handler revalidates every tag", async () => {
  const revalidate = vi.fn();
  const handler = createRevalidateHandler(revalidate);
  const res = await handler(
    request({ body: JSON.stringify({ tags: ["stock:1", "product:1"] }) }),
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ revalidated: ["stock:1", "product:1"] });
  expect(revalidate).toHaveBeenCalledWith("stock:1");
  expect(revalidate).toHaveBeenCalledWith("product:1");
});
