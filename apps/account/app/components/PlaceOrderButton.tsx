"use client";

import { Button } from "@lab/ui";
import { useOffline } from "next/offline";
import { useState, useTransition } from "react";
import { placeOrderAction } from "../orders/actions";

export function PlaceOrderButton() {
  const [pending, startTransition] = useTransition();
  const isOffline = useOffline();
  const [message, setMessage] = useState<string | null>(null);

  function placeOrder() {
    startTransition(async () => {
      try {
        const result = await placeOrderAction();
        setMessage(
          "error" in result ? result.error : `Order #${result.orderId} placed`,
        );
      } catch {
        setMessage("Could not place the order. Try again.");
      }
    });
  }

  const label = pending
    ? isOffline
      ? "Placing order (offline, will retry)…"
      : "Placing order…"
    : "Place order";

  return (
    <div>
      <Button onClick={placeOrder} disabled={pending}>
        {label}
      </Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
