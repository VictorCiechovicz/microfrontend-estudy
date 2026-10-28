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
    guides: "Guias",
    guidesLead: "Textos de apoio escritos em Markdown e lidos no build.",
    readGuide: "Ler guia",
    backToGuides: "← Todos os guias",
    catalogEyebrow: "Zona catálogo",
    catalogLead:
      "Produtos servidos pela zona catálogo. Clique em um para ver o detalhe com estoque, avaliações e recomendados.",
    featured: "Destaque",
    allProducts: "Todos os produtos",
    backToCatalog: "← Catálogo",
    description: "Descrição",
    stockHeading: "Estoque",
    reviewCount: "{n} avaliações",
    adminLead:
      "Mude o preço de um produto. A lista do catálogo atualiza na hora; a página do produto mostra o preço antigo uma vez e depois o novo.",
    adminLoginLead: "Entre com um usuário para editar preços.",
    priceHint: "Ex.: 1999 para R$ 19,99",
    errorLabLead:
      "Erros provocados de propósito para ver o overlay de erros do Next 16: causa encadeada (Error.cause) e hydration mismatch.",
    errorLabHowTo:
      "Rode o catálogo com pnpm dev e volte a esta página para ver os botões.",
    notFoundTitle: "Página não encontrada",
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
    guides: "Guides",
    guidesLead: "Help texts written in Markdown and read at build time.",
    readGuide: "Read guide",
    backToGuides: "← All guides",
    catalogEyebrow: "Catalog zone",
    catalogLead:
      "Products served by the catalog zone. Click one to see its detail with stock, reviews and recommendations.",
    featured: "Featured",
    allProducts: "All products",
    backToCatalog: "← Catalog",
    description: "Description",
    stockHeading: "Stock",
    reviewCount: "{n} reviews",
    adminLead:
      "Change a product's price. The catalog list updates at once; the product page shows the old price once and then the new one.",
    adminLoginLead: "Log in with a user to edit prices.",
    priceHint: "E.g. 1999 for $19.99",
    errorLabLead:
      "Errors triggered on purpose to see the Next 16 error overlay: chained cause (Error.cause) and hydration mismatch.",
    errorLabHowTo:
      "Run the catalog with pnpm dev and come back to this page to see the buttons.",
    notFoundTitle: "Page not found",
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
