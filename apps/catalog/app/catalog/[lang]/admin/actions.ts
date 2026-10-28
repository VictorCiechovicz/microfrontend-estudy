"use server";

import { broadcastInvalidation, type CacheReport, tags } from "@lab/cache-sync";
import { getProduct, setPrice } from "@lab/db";
import { isLang } from "@lab/db/langs";
import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "../../../../lib/session";

const MAX_PRICE_CENTS = 10_000_000;

export type SetPriceResult =
  | { ok: true; productId: number; priceCents: number; cache: CacheReport }
  | { ok: false; error: "unknownProduct" | "invalidPrice" };

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
    return { ok: false, error: "unknownProduct" };
  }
  const priceCents = parsePositiveInt(
    formData.get("priceCents"),
    MAX_PRICE_CENTS,
  );
  if (priceCents === null) return { ok: false, error: "invalidPrice" };

  setPrice(productId, priceCents);
  revalidateTag(tags.product(productId), "max");
  revalidateTag(tags.productRankings(), "max");
  updateTag(tags.products());
  const broadcastTags = [
    tags.product(productId),
    tags.productRankings(),
    tags.products(),
  ];
  const results = await broadcastInvalidation(broadcastTags, {
    from: "catalog",
  });
  return {
    ok: true,
    productId,
    priceCents,
    cache: {
      zone: "catalog",
      local: [
        {
          kind: "revalidateTag",
          tag: tags.product(productId),
          profile: "'max'",
        },
        {
          kind: "revalidateTag",
          tag: tags.productRankings(),
          profile: "'max'",
        },
        { kind: "updateTag", tag: tags.products() },
      ],
      broadcast: { tags: broadcastTags, results },
    },
  };
}
