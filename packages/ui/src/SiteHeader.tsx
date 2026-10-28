import type { ReactNode } from "react";
import styles from "./SiteHeader.module.css";

export function SiteHeader({
  zone,
  userSlot,
  cartSlot,
}: {
  zone: "shell" | "catalog" | "account";
  userSlot?: ReactNode;
  cartSlot?: ReactNode;
}) {
  return (
    <header className={styles.header} data-header-zone={zone}>
      <nav className={styles.nav} aria-label="Main">
        <a href="/">Home</a>
        <a href="/catalog/pt">Catalog</a>
        <a href="/account">Account</a>
      </nav>
      <div className={styles.slots}>
        {cartSlot}
        {userSlot}
      </div>
    </header>
  );
}
