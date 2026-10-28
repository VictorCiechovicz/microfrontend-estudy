import { Price } from "@lab/ui";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getProductDetail } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";
import { Related } from "./Related";
import { Reviews } from "./Reviews";
import { ReviewsJump } from "./ReviewsJump";
import { StockBlock } from "./StockBlock";
import StockErrorBoundary from "./StockErrorBoundary";

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

function parseId(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

type Params = Promise<{ lang: string; id: string }>;

export default function ProductPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main aria-busy="true" />}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: { params: Params }) {
  const id = parseId((await params).id);
  const product = id === null ? null : await getProductDetail(id);
  if (!product) notFound();
  const lang = await currentLang();
  return (
    <main>
      <ViewTransition name={`product-${product.id}`}>
        <h1>{product.name}</h1>
      </ViewTransition>
      <p>{product.description}</p>
      <Price cents={product.priceCents} lang={lang} />
      <ReviewsJump
        label={await t("seeReviews")}
        reviews={
          <Suspense fallback={<p>{await t("loadingReviews")}</p>}>
            <Reviews id={product.id} />
          </Suspense>
        }
      >
        <StockErrorBoundary
          message={await t("stockUnavailable")}
          retryLabel={await t("retry")}
        >
          <Suspense fallback={<p>…</p>}>
            <StockBlock id={product.id} />
          </Suspense>
        </StockErrorBoundary>
        <Suspense fallback={<p>Loading related…</p>}>
          <Related id={product.id} />
        </Suspense>
      </ReviewsJump>
    </main>
  );
}
