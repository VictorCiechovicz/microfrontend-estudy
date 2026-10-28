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
    addToCart: "Adicionar ao carrinho",
    addToCartFailed: "Não foi possível adicionar ao carrinho",
    priceAdmin: "Admin de preços",
    logIn: "Entrar",
    productId: "Id do produto",
    priceCents: "Preço (centavos)",
    updatePrice: "Atualizar preço",
    priceUpdated: "Produto {id} agora custa {cents} centavos",
    unknownProduct: "Produto desconhecido",
    invalidPrice: "Preço inválido",
    errorLab: "Laboratório de erros",
    errorLabDevOnly: "Disponível apenas em next dev.",
    errorLabCauseChain: "Provocar erro com causa encadeada",
    errorLabHydration: "Provocar hydration mismatch",
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
    addToCart: "Add to cart",
    addToCartFailed: "Could not add to cart",
    priceAdmin: "Price admin",
    logIn: "Log in",
    productId: "Product id",
    priceCents: "Price (cents)",
    updatePrice: "Update price",
    priceUpdated: "Product {id} now costs {cents} cents",
    unknownProduct: "Unknown product",
    invalidPrice: "Invalid price",
    errorLab: "Error lab",
    errorLabDevOnly: "Only available in next dev.",
    errorLabCauseChain: "Trigger error with chained cause",
    errorLabHydration: "Trigger hydration mismatch",
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
