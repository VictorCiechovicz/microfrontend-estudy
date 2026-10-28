import styles from "./Badge.module.css";

export function Badge({
  count,
  label,
  tone = "alert",
}: {
  count: number;
  label: string;
  tone?: "alert" | "neutral";
}) {
  const classes = [styles.badge, styles[tone], count === 0 ? styles.zero : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} role="status" aria-label={`${count} ${label}`}>
      {count}
    </span>
  );
}
