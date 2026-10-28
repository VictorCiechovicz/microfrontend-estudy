import styles from "./Price.module.css";

const FORMATS = {
  pt: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  en: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

export function Price({
  cents,
  lang = "pt",
}: {
  cents: number;
  lang?: "pt" | "en";
}) {
  const text = FORMATS[lang].format(cents / 100).replace(/ /g, " ");
  return <span className={styles.price}>{text}</span>;
}
