import { type NoteSlug, Skeleton } from "@lab/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { renderInline, renderMarkdown } from "../../../lib/markdown";
import { getNote, notes } from "../../../lib/notes";
import { NOTE_PLACES } from "../../../lib/study";
import styles from "../estudo.module.css";

const KNOWN_SLUGS = new Set(notes.map((note) => note.slug));

export function generateStaticParams() {
  return notes.map((note) => ({ slug: note.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const note = getNote((await params).slug);
  return { title: note ? `${note.slug} · Notas de estudo` : "Nota" };
}

export default function NotePage({ params }: { params: Params }) {
  return (
    <main>
      <Link href="/estudo" className="lab-back">
        ← Todas as notas
      </Link>
      <Suspense fallback={<Skeleton label="Carregando nota…" lines={6} />}>
        <NoteArticle params={params} />
      </Suspense>
    </main>
  );
}

async function NoteArticle({ params }: { params: Params }) {
  const note = getNote((await params).slug);
  if (!note) notFound();
  const { html, headings } = renderMarkdown(note.source, KNOWN_SLUGS);
  const sections = headings.filter((heading) => heading.depth === 2);
  const place = NOTE_PLACES[note.slug as NoteSlug];
  return (
    <div className={styles.noteLayout}>
      <article className={styles.article}>
        <p className={styles.articleEyebrow}>
          Nota de estudo · docs/features/{note.slug}.md
        </p>
        <h1
          className={styles.articleTitle}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: title comes from the repo's own markdown
          dangerouslySetInnerHTML={{ __html: renderInline(note.title) }}
        />
        <div
          className={styles.prose}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered from the repo's own markdown
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
      <aside className={styles.toc} aria-label="Nesta nota">
        {place ? (
          <a className={styles.place} href={place.href}>
            <span>Ver no app</span>
            {place.label} →
          </a>
        ) : null}
        {sections.length > 0 ? (
          <>
            <p className={styles.tocTitle}>Nesta nota</p>
            <ol className={styles.tocList}>
              {sections.map((heading) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </aside>
    </div>
  );
}
