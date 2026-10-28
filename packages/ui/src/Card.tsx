import type { ReactNode } from "react";
import styles from "./Card.module.css";

export function Card({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <article className={styles.card}>
      <h2 className={styles.title}>
        {href ? <a href={href}>{title}</a> : title}
      </h2>
      {children}
    </article>
  );
}
