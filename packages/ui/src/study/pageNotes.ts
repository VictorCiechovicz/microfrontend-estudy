import type { NoteLink } from "../notes";

const PAGE_NOTES: { match: RegExp; notes: NoteLink[] }[] = [
  { match: /^\/$/, notes: ["ensure-static", "multi-zones", "icons"] },
  { match: /^\/estudo(\/|$)/, notes: ["glob-imports", "ensure-static"] },
  {
    match: /^\/catalog\/[^/]+\/products\/[^/]+/,
    notes: [
      "cache-components",
      "partial-prefetching",
      "navigation-prefetch",
      "catch-error",
      "view-transitions",
      "isr-shell",
      "module-federation",
    ],
  },
  { match: /^\/catalog\/[^/]+\/guides/, notes: ["glob-imports", "proxy"] },
  {
    match: /^\/catalog\/[^/]+\/admin/,
    notes: ["cross-zone-cache", "update-tag"],
  },
  { match: /^\/catalog\/[^/]+\/lab\/errors/, notes: ["error-overlay"] },
  {
    match: /^\/catalog\/(sale|[^/]+\/sale-[ab])/,
    notes: ["proxy", "multi-zones"],
  },
  {
    match: /^\/catalog\/[^/]+\/?$/,
    notes: [
      "partial-prefetching",
      "view-transitions",
      "root-params",
      "module-federation",
    ],
  },
  { match: /^\/account\/login/, notes: ["proxy", "multi-zones"] },
  { match: /^\/account\/orders\/\d+/, notes: ["parallel-routes"] },
  {
    match: /^\/account\/orders/,
    notes: [
      {
        slug: "navigation-prefetch",
        hash: "navigation-na-conta-histórico-de-pedidos",
      },
      "update-tag",
      "offline",
      "parallel-routes",
    ],
  },
  {
    match: /^\/account\/notifications/,
    notes: ["refresh", "cross-zone-cache"],
  },
  { match: /^\/account\/profile/, notes: ["update-tag"] },
  {
    match: /^\/account\/?$/,
    notes: ["navigation-prefetch", "partial-prefetching"],
  },
];

export function notesForPath(path: string): NoteLink[] {
  return PAGE_NOTES.find((entry) => entry.match.test(path))?.notes ?? [];
}
