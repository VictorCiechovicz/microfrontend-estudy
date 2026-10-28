"use client";

import { Button } from "@lab/ui";
import { Fragment, type FragmentInstance, type ReactNode, useRef } from "react";
import styles from "./product.module.css";

export function ReviewsJump({
  label,
  summary,
  buy,
  reviews,
  study,
  children,
}: {
  label: string;
  summary: ReactNode;
  buy: ReactNode;
  reviews: ReactNode;
  study?: ReactNode;
  children: ReactNode;
}) {
  const reviewsRef = useRef<FragmentInstance>(null);
  function jumpToReviews() {
    reviewsRef.current?.scrollIntoView();
    reviewsRef.current?.focus({ preventScroll: true });
  }
  return (
    <>
      <div className={styles.detail}>
        <div className={styles.main}>
          <div className={styles.summary}>{summary}</div>
          {study}
        </div>
        <aside className={styles.aside} data-slot="product-aside">
          <div className={styles.buy}>
            {buy}
            <Button variant="secondary" onClick={jumpToReviews}>
              {label} ↓
            </Button>
          </div>
        </aside>
      </div>
      {/* biome-ignore lint/complexity/noUselessFragments: the ref needs a Fragment */}
      <Fragment ref={reviewsRef}>{reviews}</Fragment>
      {children}
    </>
  );
}
