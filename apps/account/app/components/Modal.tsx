"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function Modal({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgb(0 0 0 / 0.4)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ background: "white", padding: "1.5rem", minWidth: "20rem" }}
      >
        {children}
        <button type="button" onClick={() => router.back()}>
          Close
        </button>
      </div>
    </div>
  );
}
