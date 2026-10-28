"use client";

import { Button } from "@lab/ui";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Labels = { causeChain: string; hydrationMismatch: string };

function failWithCauseChain(): never {
  const root = new Error("Database connection refused");
  const middle = new Error("Could not load product list", { cause: root });
  throw new Error("Catalog page failed", { cause: middle });
}

export function ErrorLab({ labels }: { labels: Labels }) {
  const pathname = usePathname();
  const [broken, setBroken] = useState(false);
  if (broken) failWithCauseChain();
  return (
    <>
      <Button variant="secondary" onClick={() => setBroken(true)}>
        {labels.causeChain}
      </Button>
      <Button
        variant="secondary"
        onClick={() => window.location.assign(`${pathname}?mismatch=1`)}
      >
        {labels.hydrationMismatch}
      </Button>
    </>
  );
}
