import { Marked, type Tokens } from "marked";

const NOTE_REF = /^(?:\.\/)?(?:docs\/features\/)?([a-z0-9-]+)\.md(#[^\s)]*)?$/;

export type Heading = { id: string; depth: number; text: string };

export function githubSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderMarkdown(
  source: string,
  knownSlugs: ReadonlySet<string>,
): { html: string; headings: Heading[] } {
  const seen = new Map<string, number>();
  const headings: Heading[] = [];

  function noteHref(target: string): string | null {
    const match = NOTE_REF.exec(target);
    if (!match?.[1] || !knownSlugs.has(match[1])) return null;
    return `/estudo/${match[1]}${match[2] ?? ""}`;
  }

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading) {
        const text = this.parser.parseInline(tokens, this.parser.textRenderer);
        const base = githubSlug(text);
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count}`;
        if (depth === 1) return "";
        headings.push({ id, depth, text });
        const content = this.parser.parseInline(tokens);
        return `<h${depth} id="${escapeHtml(id)}">${content}</h${depth}>\n`;
      },
      link({ href, tokens }: Tokens.Link) {
        const note = noteHref(href);
        const external = /^https?:\/\//.test(href);
        if (!note && !external) return false;
        const label = this.parser.parseInline(tokens);
        const target = external ? ' target="_blank" rel="noreferrer"' : "";
        return `<a href="${escapeHtml(note ?? href)}"${target}>${label}</a>`;
      },
      codespan({ text }: Tokens.Codespan) {
        const note = noteHref(text);
        if (!note) return false;
        return `<a href="${escapeHtml(note)}" class="note-ref"><code>${escapeHtml(text)}</code></a>`;
      },
    },
  });

  const html = marked
    .parse(source, { async: false })
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return { html, headings };
}

export function renderInline(source: string): string {
  return new Marked().parseInline(source, { async: false });
}
