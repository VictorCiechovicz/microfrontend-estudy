import { RemoteWidget } from "@lab/mf-host";
import { Price } from "@lab/ui";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getProductDetail } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";
import { SlideTransition } from "../../SlideTransition";
import { AddToCart } from "./AddToCart";
import { Popular } from "./Popular";
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

export default async function ProductPage({ params }: { params: Params }) {
  return (
    <SlideTransition>
      <main>
        <Suspense fallback={<p aria-busy="true">…</p>}>
          <Product params={params} />
        </Suspense>
        <Suspense fallback={<p>{await t("loadingPopular")}</p>}>
          <Popular />
        </Suspense>
      </main>
    </SlideTransition>
  );
}

async function Product({ params }: { params: Params }) {
  const id = parseId((await params).id);
  const product = id === null ? null : await getProductDetail(id);
  if (!product) notFound();
  const lang = await currentLang();
  return (
    <>
      <ViewTransition name={`product-${product.id}`}>
        <h1>{product.name}</h1>
      </ViewTransition>
      <p>{product.description}</p>
      <p data-testid="product-price">
        <Price cents={product.priceCents} lang={lang} />
      </p>
      <AddToCart
        productId={product.id}
        label={await t("addToCart")}
        failedLabel={await t("addToCartFailed")}
      />
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
        <Suspense fallback={<p>{await t("loadingRelated")}</p>}>
          <Related id={product.id} />
        </Suspense>
      </ReviewsJump>
      <RemoteWidget
        name="Recommendations"
        props={{ excludeId: product.id, lang }}
      />
    </>
  );
}
