import styles from "./Badge.module.css";

export function Badge({ count, label }: { count: number; label: string }) {
  return (
    <span
      className={styles.badge}
      role="status"
      aria-label={`${count} ${label}`}
    >
      {count}
    </span>
  );
}
