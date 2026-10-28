const sources = import.meta.glob<{ default: string }>(
  ["../../../docs/features/*.md", "!../../../docs/features/._*"],
  { eager: true, query: "?raw" },
);

export type Note = {
  slug: string;
  title: string;
  excerpt: string;
  source: string;
};

function firstParagraph(source: string): string {
  const blocks = source.split(/\n\s*\n/).map((block) => block.trim());
  const paragraph = blocks.find(
    (block) =>
      block !== "" &&
      !/^(#|\||-|\d+\.|```|>)/.test(block) &&
      !block.startsWith("<"),
  );
  return (paragraph ?? "").replace(/\s+/g, " ");
}

function parseNote(path: string, source: string): Note {
  const slug = path.slice(path.lastIndexOf("/") + 1, -".md".length);
  const heading = source.match(/^#\s+(.+)$/m)?.[1] ?? slug;
  return {
    slug,
    title: heading.trim(),
    excerpt: firstParagraph(source),
    source,
  };
}

export const notes: Note[] = Object.entries(sources).map(([path, module]) =>
  parseNote(path, module.default),
);

const bySlug = new Map(notes.map((note) => [note.slug, note]));

export function getNote(slug: string): Note | undefined {
  return bySlug.get(slug);
}
