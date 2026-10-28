import { PageHeader, StudyNote } from "@lab/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { renderInline } from "../../lib/markdown";
import { type Note, notes } from "../../lib/notes";
import { THEMES } from "../../lib/study";
import styles from "./estudo.module.css";

export const ensureStatic = "navigation";

export const metadata: Metadata = { title: "Notas de estudo · Lab Store" };

function NoteCard({ note }: { note: Note }) {
  return (
    <li className={styles.card} data-testid="note-card">
      <h3 className={styles.cardTitle}>
        <Link href={`/estudo/${note.slug}`}>
          <span
            // biome-ignore lint/security/noDangerouslySetInnerHtml: title comes from the repo's own markdown
            dangerouslySetInnerHTML={{ __html: renderInline(note.title) }}
          />
        </Link>
      </h3>
      <p
        className={styles.excerpt}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: excerpt comes from the repo's own markdown
        dangerouslySetInnerHTML={{ __html: renderInline(note.excerpt) }}
      />
      <span className={styles.file}>{note.slug}.md</span>
    </li>
  );
}

export default function StudyIndexPage() {
  const themed = new Set<string>(THEMES.flatMap((theme) => theme.slugs));
  const others = notes.filter((note) => !themed.has(note.slug));
  const groups = [
    ...THEMES.map((theme) => ({
      ...theme,
      notes: theme.slugs.flatMap(
        (slug) => notes.find((note) => note.slug === slug) ?? [],
      ),
    })),
    ...(others.length > 0
      ? [{ id: "outras", title: "Outras", lead: "", notes: others }]
      : []),
  ];
  return (
    <main>
      <PageHeader
        eyebrow="Modo estudo"
        title="Notas de estudo"
        lead={`As ${notes.length} notas de docs/features: o que cada funcionalidade é, onde está no código, como observar e o que o lab mediu (inclusive o que não saiu como planejado).`}
      />
      <StudyNote className={styles.studyNote} notes={["glob-imports"]}>
        <p>
          Estas páginas são geradas no build: o shell lê{" "}
          <code>docs/features/*.md</code> com <code>import.meta.glob</code> (a
          mesma técnica dos guias do catálogo) e renderiza o Markdown com o{" "}
          <code>marked</code>. Este índice tem{" "}
          <code>ensureStatic = 'navigation'</code>; uma nota que não existe
          responde 404 pelo <code>proxy.ts</code> do shell.
        </p>
      </StudyNote>
      <nav className={styles.themeNav} aria-label="Temas">
        {groups.map((group) => (
          <a key={group.id} href={`#${group.id}`}>
            {group.title} <span>{group.notes.length}</span>
          </a>
        ))}
      </nav>
      {groups.map((group) => (
        <section
          key={group.id}
          id={group.id}
          className={styles.theme}
          aria-labelledby={`${group.id}-heading`}
        >
          <h2 id={`${group.id}-heading`}>{group.title}</h2>
          {group.lead ? <p className={styles.themeLead}>{group.lead}</p> : null}
          <ul className={styles.grid}>
            {group.notes.map((note) => (
              <NoteCard key={note.slug} note={note} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
