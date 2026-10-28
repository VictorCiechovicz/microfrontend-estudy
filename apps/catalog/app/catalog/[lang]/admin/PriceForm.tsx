"use client";

import type { Lang } from "@lab/db/langs";
import { Button } from "@lab/ui";
import { useState } from "react";
import { type SetPriceResult, setPriceAction } from "./actions";

export function PriceForm({ lang }: { lang: Lang }) {
  const [result, setResult] = useState<SetPriceResult | null>(null);

  async function submit(formData: FormData) {
    setResult(await setPriceAction(formData));
  }

  return (
    <form action={submit}>
      <input type="hidden" name="lang" value={lang} />
      <p>
        <label>
          Product id <input name="productId" inputMode="numeric" required />
        </label>
      </p>
      <p>
        <label>
          Price (cents) <input name="priceCents" inputMode="numeric" required />
        </label>
      </p>
      <Button type="submit">Update price</Button>
      {result?.ok ? (
        <p role="status">
          Product {result.productId} now costs {result.priceCents} cents
        </p>
      ) : null}
      {result && !result.ok ? <p role="alert">{result.error}</p> : null}
    </form>
  );
}
