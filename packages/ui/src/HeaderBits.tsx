import { Badge } from "./Badge";
import styles from "./HeaderBits.module.css";

export function NotificationBell({ count }: { count: number }) {
  return (
    <span className={styles.pill}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <Badge count={count} label="notificações não lidas" />
    </span>
  );
}

export function UserChip({ name }: { name: string }) {
  return (
    <span className={styles.user}>
      <span className={styles.avatar} aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span data-testid="user-name">{name}</span>
    </span>
  );
}
