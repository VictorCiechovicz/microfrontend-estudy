import { RemoteWidget } from "@lab/mf-host";
import { Price, Skeleton } from "@lab/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getProductDetail } from "../../../../../lib/data";
import { currentLang, t } from "../../../../../lib/i18n";
import { ProductTile } from "../../../../components/ProductTile";
import { SlideTransition } from "../../SlideTransition";
import { AddToCart } from "./AddToCart";
import { Popular } from "./Popular";
import styles from "./product.module.css";
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
        <Link href={`/catalog/${await currentLang()}`} className="lab-back">
          {await t("backToCatalog")}
        </Link>
        <Suspense fallback={<Skeleton label="…" lines={4} />}>
          <Product params={params} />
        </Suspense>
        <Suspense fallback={<Skeleton label={await t("loadingPopular")} />}>
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
      <ReviewsJump
        label={await t("seeReviews")}
        summary={
          <>
            <ProductTile id={product.id} size="lg" />
            <ViewTransition name={`product-${product.id}`}>
              <h1 className={styles.title}>{product.name}</h1>
            </ViewTransition>
            <p className={styles.description}>{product.description}</p>
          </>
        }
        buy={
          <>
            <p data-testid="product-price" className={styles.price}>
              <Price cents={product.priceCents} lang={lang} />
            </p>
            <StockErrorBoundary
              message={await t("stockUnavailable")}
              retryLabel={await t("retry")}
            >
              <Suspense fallback={<p className={styles.stockPending}>…</p>}>
                <StockBlock id={product.id} />
              </Suspense>
            </StockErrorBoundary>
            <AddToCart
              productId={product.id}
              label={await t("addToCart")}
              failedLabel={await t("addToCartFailed")}
            />
          </>
        }
        reviews={
          <Suspense fallback={<Skeleton label={await t("loadingReviews")} />}>
            <Reviews id={product.id} />
          </Suspense>
        }
      >
        <Suspense fallback={<Skeleton label={await t("loadingRelated")} />}>
          <Related id={product.id} />
        </Suspense>
      </ReviewsJump>
      <div className={styles.widget}>
        <RemoteWidget
          name="Recommendations"
          props={{ excludeId: product.id, lang }}
        />
      </div>
    </>
  );
}
