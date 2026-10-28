"use server";

import { broadcastInvalidation, tags } from "@lab/cache-sync";
import { getProduct, setPrice } from "@lab/db";
import { isLang } from "@lab/db/langs";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "../../../../lib/session";

const MAX_PRICE_CENTS = 10_000_000;

export type SetPriceResult =
  | { ok: true; productId: number; priceCents: number }
  | { ok: false; error: "Unknown product" | "Invalid price" };

function parsePositiveInt(
  value: FormDataEntryValue | null,
  max: number,
): number | null {
  if (typeof value !== "string" || !/^\d{1,15}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && parsed <= max ? parsed : null;
}

export async function setPriceAction(
  formData: FormData,
): Promise<SetPriceResult> {
  if ((await getSessionUserId()) === null) {
    const lang = formData.get("lang");
    const next = `/catalog/${isLang(lang) ? lang : "pt"}/admin`;
    redirect(`/account/login?${new URLSearchParams({ next })}`);
  }
  const productId = parsePositiveInt(
    formData.get("productId"),
    Number.MAX_SAFE_INTEGER,
  );
  if (productId === null || !getProduct(productId, "en")) {
    return { ok: false, error: "Unknown product" };
  }
  const priceCents = parsePositiveInt(
    formData.get("priceCents"),
    MAX_PRICE_CENTS,
  );
  if (priceCents === null) return { ok: false, error: "Invalid price" };

  setPrice(productId, priceCents);
  revalidateTag(tags.product(productId), "max");
  revalidateTag(tags.products(), "max");
  await broadcastInvalidation([tags.product(productId), tags.products()], {
    from: "catalog",
  });
  return { ok: true, productId, priceCents };
}
