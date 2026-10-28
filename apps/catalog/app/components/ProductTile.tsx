import type { CSSProperties } from "react";
import styles from "./ProductTile.module.css";

export function ProductTile({
  id,
  size = "md",
}: {
  id: number;
  size?: "md" | "lg";
}) {
  const style = { "--tile-hue": `${(id * 47) % 360}` } as CSSProperties;
  return (
    <span
      className={`${styles.tile} ${styles[size]}`}
      style={style}
      aria-hidden="true"
    >
      <span className={styles.code}>#{String(id).padStart(2, "0")}</span>
    </span>
  );
}
