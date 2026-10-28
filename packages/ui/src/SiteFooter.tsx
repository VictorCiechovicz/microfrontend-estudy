import styles from "./SiteFooter.module.css";
import { ZONE_ORDER, ZONES } from "./zones";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>
          <strong>Lab Store</strong> · laboratório de microfrontends com Next 16
        </span>
        <ul className={styles.legend} aria-label="Zonas e portas">
          {ZONE_ORDER.map((id) => (
            <li key={id} data-legend-zone={id}>
              {ZONES[id].label} :{ZONES[id].port}
            </li>
          ))}
          <li data-legend-zone="widgets">widgets :3003</li>
        </ul>
      </div>
    </footer>
  );
}
