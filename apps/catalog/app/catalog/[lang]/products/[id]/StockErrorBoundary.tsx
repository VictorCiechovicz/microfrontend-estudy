"use client";

import { Button } from "@lab/ui";
import { catchError, type ErrorInfo } from "next/error";

function StockFallback(
  { message, retryLabel }: { message: string; retryLabel: string },
  { retry }: ErrorInfo,
) {
  return (
    <div role="alert">
      <p>{message}</p>
      <Button onClick={() => retry()}>{retryLabel}</Button>
    </div>
  );
}

export default catchError(StockFallback);
