"use client";

import { Button } from "@lab/ui";
import { Fragment, type FragmentInstance, type ReactNode, useRef } from "react";

export function ReviewsJump({
  label,
  reviews,
  children,
}: {
  label: string;
  reviews: ReactNode;
  children: ReactNode;
}) {
  const reviewsRef = useRef<FragmentInstance>(null);
  function jumpToReviews() {
    reviewsRef.current?.scrollIntoView();
    reviewsRef.current?.focus();
  }
  return (
    <>
      <p>
        <Button variant="ghost" onClick={jumpToReviews}>
          {label}
        </Button>
      </p>
      {children}
      {/* biome-ignore lint/complexity/noUselessFragments: the ref needs a Fragment */}
      <Fragment ref={reviewsRef}>{reviews}</Fragment>
    </>
  );
}
