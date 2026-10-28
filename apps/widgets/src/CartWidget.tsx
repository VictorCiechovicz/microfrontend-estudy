import { Badge } from "@lab/ui";
import { useEffect, useState } from "react";
import { CART_CHANGED, type CartChangedDetail } from "./cart-events";
import { createMount } from "./mount";

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

    async function load() {
      const request = ++latest;
      const next = await fetchCount();
      if (disposed || request !== latest) return;
      const changed = next !== shown;
      shown = next;
      setCount(next);
      if (changed && next !== null) {
        window.dispatchEvent(
          new CustomEvent<CartChangedDetail>(CART_CHANGED, {
            detail: { count: next },
          }),
        );
      }
    }

    function onCartChanged(event: Event) {
      const { detail } = event as CustomEvent<CartChangedDetail | null>;
      if (detail?.count !== shown) void load();
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
    <a href="/account/orders">
      Cart{" "}
      <Badge
        count={count}
        label={count === 1 ? "item in cart" : "items in cart"}
      />
    </a>
  );
}

export const mount = createMount(CartWidget);
