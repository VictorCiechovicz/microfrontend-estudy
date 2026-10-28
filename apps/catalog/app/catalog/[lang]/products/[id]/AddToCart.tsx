"use client";

import type { CacheReport } from "@lab/cache-sync";
import { Button } from "@lab/ui";
import { announceCacheReport } from "@lab/ui/study";
import { useState } from "react";
import styles from "./product.module.css";

const CART_CHANGED = "lab:cart-changed";

type CartBody = { lines: { qty: number }[]; cache?: CacheReport };

export function AddToCart({
  productId,
  label,
  failedLabel,
}: {
  productId: number;
  label: string;
  failedLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "failed">("idle");

  async function add() {
    setStatus("pending");
    const response = await fetch("/account/api/cart", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, qty: 1 }),
    }).catch(() => null);
    if (response?.status === 401) {
      const next = encodeURIComponent(window.location.pathname);
      window.location.assign(`/account/login?next=${next}`);
      return;
    }
    const body = response?.ok
      ? ((await response.json().catch(() => null)) as CartBody | null)
      : null;
    if (!body) {
      setStatus("failed");
      return;
    }
    const count = body.lines.reduce((sum, line) => sum + line.qty, 0);
    window.dispatchEvent(new CustomEvent(CART_CHANGED, { detail: { count } }));
    setStatus("idle");
    if (body.cache) announceCacheReport(body.cache);
  }

  return (
    <div className={styles.addToCart}>
      <Button size="lg" onClick={add} disabled={status === "pending"}>
        {label}
      </Button>
      {status === "failed" ? (
        <span role="alert" className={styles.inlineError}>
          {failedLabel}
        </span>
      ) : null}
    </div>
  );
}
