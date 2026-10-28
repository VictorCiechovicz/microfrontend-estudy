import type { NoteSlug } from "@lab/ui";

export type Theme = {
  id: string;
  title: string;
  lead: string;
  slugs: NoteSlug[];
};

export const THEMES: Theme[] = [
  {
    id: "microfrontends",
    title: "Microfrontends",
    lead: "Como três apps Next e um remote de Module Federation viram uma loja só, e como o cache delas conversa.",
    slugs: ["multi-zones", "module-federation", "cross-zone-cache", "proxy"],
  },
  {
    id: "cache",
    title: "Cache e navegação",
    lead: "O que é estático, o que é cacheado e o que chega em cada etapa da navegação.",
    slugs: [
      "cache-components",
      "partial-prefetching",
      "navigation-prefetch",
      "ensure-static",
      "isr-shell",
      "prefetch-inlining",
      "instant-test",
    ],
  },
  {
    id: "actions",
    title: "Server Actions e mutações",
    lead: "Ler o que acabou de escrever, re-renderizar sem tocar no cache e sobreviver sem rede.",
    slugs: ["update-tag", "refresh", "offline", "parallel-routes"],
  },
  {
    id: "ui",
    title: "Rotas, React e interface",
    lead: "View Transitions, error boundaries, root params e as convenções de arquivo do App Router.",
    slugs: [
      "view-transitions",
      "catch-error",
      "error-overlay",
      "root-params",
      "glob-imports",
      "async-request-apis",
      "image-response",
      "icons",
    ],
  },
  {
    id: "tooling",
    title: "Ferramentas e build",
    lead: "Turbopack, React Compiler, TypeScript 7 e o que ajuda a depurar e medir.",
    slugs: [
      "turbopack-default",
      "turbopack-flags",
      "react-compiler",
      "typescript-7",
      "bundle-analyzer",
      "inspect",
      "devtools",
      "agents",
    ],
  },
];

export const NOTE_PLACES: Partial<
  Record<NoteSlug, { href: string; label: string }>
> = {
  "multi-zones": { href: "/catalog/pt", label: "Catálogo" },
  "module-federation": { href: "/catalog/pt/products/5", label: "Produto 5" },
  "cross-zone-cache": { href: "/catalog/pt/admin", label: "Admin de preços" },
  proxy: { href: "/catalog/sale", label: "/catalog/sale" },
  "cache-components": { href: "/catalog/pt/products/1", label: "Produto 1" },
  "partial-prefetching": { href: "/catalog/pt", label: "Catálogo" },
  "navigation-prefetch": { href: "/account/orders", label: "Pedidos" },
  "ensure-static": { href: "/", label: "Início" },
  "isr-shell": { href: "/catalog/pt/products/9", label: "Produto 9" },
  "update-tag": { href: "/account/profile", label: "Perfil" },
  refresh: { href: "/account/notifications", label: "Notificações" },
  offline: { href: "/account/orders", label: "Pedidos" },
  "parallel-routes": { href: "/account/orders", label: "Pedidos" },
  "view-transitions": { href: "/catalog/pt", label: "Catálogo" },
  "catch-error": { href: "/catalog/pt/products/4", label: "Produto 4" },
  "error-overlay": {
    href: "/catalog/pt/lab/errors",
    label: "Laboratório de erros",
  },
  "root-params": { href: "/catalog/en", label: "Catálogo em inglês" },
  "glob-imports": { href: "/catalog/pt/guides", label: "Guias" },
  "image-response": {
    href: "/catalog/pt/products/1/opengraph-image",
    label: "Imagem OG do Produto 1",
  },
};
