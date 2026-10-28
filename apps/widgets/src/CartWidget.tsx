import { Badge } from "@lab/ui";
import { useEffect, useState } from "react";
import { CART_CHANGED, type CartChangedDetail } from "./cart-events";
import { createMount } from "./mount";
import styles from "./widgets.module.css";

type CartBody = { lines: { qty: number }[] };

async function fetchCount(): Promise<number | null> {
  try {
    const response = await fetch("/account/api/cart", {
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const { lines } = (await response.json()) as CartBody;
    return lines.reduce((sum, line) => sum + line.qty, 0);
  } catch {
    return null;
  }
}

export default function CartWidget() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let latest = 0;
    let shown: number | null = null;
    let dispatched: Event | null = null;

    async function load() {
      const request = ++latest;
      const next = await fetchCount();
      if (disposed || request !== latest) return;
      const changed = next !== shown;
      shown = next;
      setCount(next);
      if (changed && next !== null) {
        dispatched = new CustomEvent<CartChangedDetail>(CART_CHANGED, {
          detail: { count: next },
        });
        window.dispatchEvent(dispatched);
      }
    }

    function onCartChanged(event: Event) {
      if (event !== dispatched) void load();
    }

    window.addEventListener(CART_CHANGED, onCartChanged);
    void load();
    return () => {
      disposed = true;
      window.removeEventListener(CART_CHANGED, onCartChanged);
    };
  }, []);

  if (count === null) return null;
  return (
    <a href="/account/orders" className={`${styles.root} ${styles.cart}`}>
      <svg
        className={styles.cartIcon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3h2.6l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21.5 8H6.1" />
      </svg>
      Carrinho{" "}
      <Badge
        count={count}
        tone="neutral"
        label={count === 1 ? "item no carrinho" : "itens no carrinho"}
      />
    </a>
  );
}

export const mount = createMount(CartWidget);
