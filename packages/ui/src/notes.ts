export const NOTE_LABELS = {
  agents: "agentUpgrade e AGENTS.md",
  "async-request-apis": "APIs de requisição assíncronas",
  "bundle-analyzer": "Bundle Analyzer",
  "cache-components": "Cache Components",
  "catch-error": "catchError + retry()",
  "cross-zone-cache": "Cache entre zonas",
  devtools: "DevTools do next dev",
  "ensure-static": "ensureStatic",
  "error-overlay": "Overlay de erros",
  "glob-imports": "import.meta.glob",
  icons: "Ícones",
  "image-response": "ImageResponse (OG)",
  inspect: "--inspect",
  "instant-test": "instant() no Playwright",
  "isr-shell": "ISR com shell instantâneo",
  "module-federation": "Module Federation",
  "multi-zones": "Multi-Zones",
  "navigation-prefetch": "navigation() e prefetch()",
  offline: "useOffline",
  "parallel-routes": "Parallel + intercepting routes",
  "partial-prefetching": "Partial Prefetching",
  "prefetch-inlining": "Prefetch inlining",
  proxy: "proxy.ts",
  "react-compiler": "React Compiler",
  refresh: "refresh()",
  "root-params": "Root params",
  "turbopack-default": "Turbopack padrão",
  "turbopack-flags": "Flags do Turbopack",
  "typescript-7": "TypeScript 7",
  "update-tag": "updateTag()",
  "view-transitions": "View Transitions",
} as const;

export type NoteSlug = keyof typeof NOTE_LABELS;

export type NoteLink = NoteSlug | { slug: NoteSlug; hash: string };

export function noteHref(link: NoteLink): string {
  return typeof link === "string"
    ? `/estudo/${link}`
    : `/estudo/${link.slug}#${link.hash}`;
}

export function noteLabel(link: NoteLink): string {
  return NOTE_LABELS[typeof link === "string" ? link : link.slug];
}
