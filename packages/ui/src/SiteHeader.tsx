import type { ReactNode } from "react";
import styles from "./SiteHeader.module.css";
import { ZONE_ORDER, ZONES, type Zone } from "./zones";

export function SiteHeader({
  zone,
  userSlot,
  cartSlot,
}: {
  zone: Zone;
  userSlot?: ReactNode;
  cartSlot?: ReactNode;
}) {
  const current = ZONES[zone];
  return (
    <header className={styles.header} data-header-zone={zone}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Lab Store
        </a>
        <nav className={styles.nav} aria-label="Principal">
          {ZONE_ORDER.map((id) => (
            <a
              key={id}
              href={ZONES[id].href}
              className={styles.navLink}
              data-nav-zone={id}
              aria-current={id === zone ? "true" : undefined}
            >
              {ZONES[id].nav}
            </a>
          ))}
          <a href="/estudo" className={`${styles.navLink} ${styles.navStudy}`}>
            Notas de estudo
          </a>
        </nav>
        <span
          className={styles.chip}
          title={`Esta página foi servida pela zona ${current.label}, na porta ${current.port}`}
        >
          <span className={styles.dot} aria-hidden="true" />
          zona: {current.label} · :{current.port}
        </span>
        <div className={styles.slots}>
          {cartSlot}
          {userSlot}
        </div>
      </div>
    </header>
  );
}
