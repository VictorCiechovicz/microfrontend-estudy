import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export function EmptyState({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <p className={styles.text}>{children}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
