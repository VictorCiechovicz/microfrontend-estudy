"use client";

import { Button } from "@lab/ui";
import { useOffline } from "next/offline";
import { useState, useTransition } from "react";
import { placeOrderAction } from "../orders/actions";
import styles from "./account.module.css";

type Message = { tone: "success" | "error"; text: string };

export function PlaceOrderButton() {
  const [pending, startTransition] = useTransition();
  const isOffline = useOffline();
  const [message, setMessage] = useState<Message | null>(null);

  function placeOrder() {
    startTransition(async () => {
      try {
        const result = await placeOrderAction();
        if ("error" in result) {
          setMessage({ tone: "error", text: "Seu carrinho está vazio." });
          return;
        }
        setMessage({
          tone: "success",
          text: `Pedido #${result.orderId} realizado`,
        });
        void import("canvas-confetti").then(({ default: confetti }) => {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
        });
        window.dispatchEvent(
          new CustomEvent("lab:cart-changed", { detail: { count: 0 } }),
        );
      } catch {
        setMessage({
          tone: "error",
          text: "Não foi possível fazer o pedido. Tente de novo.",
        });
      }
    });
  }

  const label = pending
    ? isOffline
      ? "Enviando pedido (offline, vai tentar de novo)…"
      : "Enviando pedido…"
    : "Fazer pedido";

  return (
    <div className={styles.placeOrder}>
      <Button size="lg" onClick={placeOrder} disabled={pending}>
        {label}
      </Button>
      {message && (
        <p
          role="status"
          className={message.tone === "success" ? styles.success : styles.error}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
