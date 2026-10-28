import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

type CardElement = "div" | "li" | "section" | "article" | "aside";

export function Card({
  as: Element = "div",
  interactive = false,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  as?: CardElement;
  interactive?: boolean;
  children: ReactNode;
}) {
  const classes = [
    styles.card,
    interactive ? styles.interactive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Element className={classes} {...rest}>
      {children}
    </Element>
  );
}
