"use client";

import { Button } from "@lab/ui";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./account.module.css";

export function Modal({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className={styles.backdrop}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={styles.dialog}
      >
        <div className={styles.dialogBody}>{children}</div>
        <div className={styles.dialogFooter}>
          <Button variant="secondary" onClick={() => router.back()}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
