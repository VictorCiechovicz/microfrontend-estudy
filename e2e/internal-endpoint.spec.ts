import { expect, test } from "@playwright/test";

const secret = { "x-lab-secret": "lab-dev-secret" };
const data = { tags: ["stock:1"] };

test("shell blocks a zone endpoint leaking through /account/internal", async ({
  request,
}) => {
  const res = await request.post(
    "http://localhost:3000/account/internal/revalidate",
    { headers: secret, data },
  );
  expect(res.status()).toBe(404);
});

test("shell blocks bare /account/internal", async ({ request }) => {
  const res = await request.get("http://localhost:3000/account/internal");
  expect(res.status()).toBe(404);
});

test("shell own endpoint is reachable but protected by the secret", async ({
  request,
}) => {
  const res = await request.post("http://localhost:3000/internal/revalidate", {
    data,
  });
  expect(res.status()).toBe(401);
});

test("account endpoint rejects a missing secret", async ({ request }) => {
  const res = await request.post(
    "http://localhost:3002/account/internal/revalidate",
    { data },
  );
  expect(res.status()).toBe(401);
});

test("account endpoint revalidates with the secret", async ({ request }) => {
  const res = await request.post(
    "http://localhost:3002/account/internal/revalidate",
    { headers: secret, data },
  );
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ revalidated: ["stock:1"] });
});
