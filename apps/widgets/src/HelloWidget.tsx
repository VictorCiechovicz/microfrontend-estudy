import { useState } from "react";
import { createMount } from "./mount";
import styles from "./widgets.module.css";

export default function HelloWidget() {
  const [text] = useState("Olá do app widgets");
  return (
    <div className={`${styles.root} ${styles.card}`}>
      <span className={styles.tag}>widgets · :3003</span>
      <div className={styles.hello}>
        <span className={styles.helloIcon} aria-hidden="true">
          MF
        </span>
        <div>
          <p className={styles.helloText} data-testid="hello-widget">
            {text}
          </p>
          <p className={styles.helloNote}>
            Este bloco não é do catálogo: é um componente React de outro app
            (Rsbuild), carregado no navegador via Module Federation.
          </p>
        </div>
      </div>
    </div>
  );
}

export const mount = createMount(HelloWidget);
