"use client";

import { useOffline } from "next/offline";
import styles from "./account.module.css";

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <div role="status" className={styles.offline}>
      <span className={styles.offlineDot} aria-hidden="true" />
      Você está offline. As requisições pendentes serão reenviadas quando a
      conexão voltar.
    </div>
  );
}
