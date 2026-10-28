import { isLang, type Lang } from "@lab/db/langs";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";

const MESSAGES = {
  pt: {
    catalog: "Catálogo",
    reviews: "Avaliações",
    loadingReviews: "Carregando avaliações…",
    seeReviews: "Ver avaliações",
    related: "Relacionados",
    loadingRelated: "Carregando relacionados…",
    popular: "Populares",
    loadingPopular: "Carregando populares…",
    inStock: "{n} em estoque",
    retry: "Tentar de novo",
    stockUnavailable: "Estoque indisponível",
  },
  en: {
    catalog: "Catalog",
    reviews: "Reviews",
    loadingReviews: "Loading reviews…",
    seeReviews: "See reviews",
    related: "Related",
    loadingRelated: "Loading related…",
    popular: "Popular",
    loadingPopular: "Loading popular…",
    inStock: "{n} in stock",
    retry: "Try again",
    stockUnavailable: "Stock unavailable",
  },
} as const satisfies Record<Lang, Record<string, string>>;

export type MessageKey = keyof (typeof MESSAGES)["pt"];

export async function currentLang(): Promise<Lang> {
  const value = await lang();
  if (!isLang(value)) notFound();
  return value;
}

export async function t(
  key: MessageKey,
  vars?: { n?: number },
): Promise<string> {
  const message: string = MESSAGES[await currentLang()][key];
  return vars?.n === undefined
    ? message
    : message.replace("{n}", String(vars.n));
}
