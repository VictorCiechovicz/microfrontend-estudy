"use client";

import type { Lang } from "@lab/db/langs";
import { Button } from "@lab/ui";
import { useState } from "react";
import { type SetPriceResult, setPriceAction } from "./actions";

export type PriceFormLabels = {
  productId: string;
  priceCents: string;
  updatePrice: string;
  priceUpdated: string;
  unknownProduct: string;
  invalidPrice: string;
};

export function PriceForm({
  lang,
  labels,
}: {
  lang: Lang;
  labels: PriceFormLabels;
}) {
  const [result, setResult] = useState<SetPriceResult | null>(null);

  async function submit(formData: FormData) {
    setResult(await setPriceAction(formData));
  }

  return (
    <form action={submit}>
      <input type="hidden" name="lang" value={lang} />
      <p>
        <label>
          {labels.productId}{" "}
          <input name="productId" inputMode="numeric" required />
        </label>
      </p>
      <p>
        <label>
          {labels.priceCents}{" "}
          <input name="priceCents" inputMode="numeric" required />
        </label>
      </p>
      <Button type="submit">{labels.updatePrice}</Button>
      {result?.ok ? (
        <p role="status">
          {labels.priceUpdated
            .replace("{id}", String(result.productId))
            .replace("{cents}", String(result.priceCents))}
        </p>
      ) : null}
      {result && !result.ok ? <p role="alert">{labels[result.error]}</p> : null}
    </form>
  );
}
