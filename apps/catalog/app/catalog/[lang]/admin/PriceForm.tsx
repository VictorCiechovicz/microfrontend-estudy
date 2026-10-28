"use client";

import type { Lang } from "@lab/db/langs";
import { Button } from "@lab/ui";
import { announceCacheReport } from "@lab/ui/study";
import { useState } from "react";
import styles from "../catalog.module.css";
import { type SetPriceResult, setPriceAction } from "./actions";

export type PriceFormLabels = {
  productId: string;
  priceCents: string;
  priceHint: string;
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
    const next = await setPriceAction(formData);
    setResult(next);
    if (next.ok) announceCacheReport(next.cache);
  }

  return (
    <form action={submit} className={styles.form}>
      <input type="hidden" name="lang" value={lang} />
      <label className={styles.field}>
        {labels.productId}
        <input name="productId" inputMode="numeric" required />
      </label>
      <div className={styles.field}>
        <label className={styles.field}>
          {labels.priceCents}
          <input
            name="priceCents"
            inputMode="numeric"
            required
            aria-describedby="price-hint"
          />
        </label>
        <span id="price-hint" className={styles.hint}>
          {labels.priceHint}
        </span>
      </div>
      <Button type="submit">{labels.updatePrice}</Button>
      {result?.ok ? (
        <p role="status" className={styles.success}>
          {labels.priceUpdated
            .replace("{id}", String(result.productId))
            .replace("{cents}", String(result.priceCents))}
        </p>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className={styles.error}>
          {labels[result.error]}
        </p>
      ) : null}
    </form>
  );
}
