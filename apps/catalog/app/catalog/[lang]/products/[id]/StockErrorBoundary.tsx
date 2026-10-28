"use client";

import { Button } from "@lab/ui";
import { catchError, type ErrorInfo } from "next/error";
import styles from "./product.module.css";

function StockFallback(
  { message, retryLabel }: { message: string; retryLabel: string },
  { retry }: ErrorInfo,
) {
  return (
    <div role="alert" className={styles.stockError}>
      <p>{message}</p>
      <Button size="sm" variant="secondary" onClick={() => retry()}>
        {retryLabel}
      </Button>
    </div>
  );
}

export default catchError(StockFallback);
