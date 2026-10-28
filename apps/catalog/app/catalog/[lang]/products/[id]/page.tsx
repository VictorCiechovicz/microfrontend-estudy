import { listReviews, withLatency } from "@lab/db";
import { Price } from "@lab/ui";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getProductDetail } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";
import { StockBlock } from "./StockBlock";
import StockErrorBoundary from "./StockErrorBoundary";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

function parseId(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const id = parseId((await params).id);
  const product = id === null ? null : await getProductDetail(id);
  if (!product) notFound();
  const lang = await currentLang();
  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <Price cents={product.priceCents} lang={lang} />
      <StockErrorBoundary
        message={await t("stockUnavailable")}
        retryLabel={await t("retry")}
      >
        <Suspense fallback={<p>…</p>}>
          <StockBlock id={product.id} />
        </Suspense>
      </StockErrorBoundary>
      <Suspense fallback={<p>{await t("loadingReviews")}</p>}>
        <Reviews id={product.id} />
      </Suspense>
    </main>
  );
}

async function Reviews({ id }: { id: number }) {
  await connection();
  const reviews = await withLatency(() => listReviews(id));
  return (
    <section>
      <h2>{await t("reviews")}</h2>
      <ul>
        {reviews.map((review) => (
          <li key={`${review.author}-${review.text}`}>
            <strong>{review.author}</strong> ({review.rating}/5): {review.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
