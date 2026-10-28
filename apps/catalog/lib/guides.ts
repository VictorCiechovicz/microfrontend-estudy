const sources = import.meta.glob<{ default: string }>(
  "../content/guides/*.md",
  { eager: true, query: "?raw" },
);

export type Guide = { slug: string; title: string; paragraphs: string[] };

function parseGuide(path: string, source: string): Guide {
  const slug = path.slice(path.lastIndexOf("/") + 1, -".md".length);
  const [heading = "", ...blocks] = source.trim().split(/\n\s*\n/);
  return {
    slug,
    title: heading.replace(/^#\s+/, ""),
    paragraphs: blocks.map((block) => block.replace(/\s+/g, " ")),
  };
}

export const guides: Guide[] = Object.entries(sources).map(([path, source]) =>
  parseGuide(path, source.default),
);

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
