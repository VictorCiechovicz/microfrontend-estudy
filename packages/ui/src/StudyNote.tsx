import type { ReactNode } from "react";
import { type NoteLink, noteHref, noteLabel } from "./notes";
import styles from "./StudyNote.module.css";

export function StudyNote({
  title = "O que observar aqui",
  notesLabel = "Notas",
  notes,
  className,
  children,
}: {
  title?: string;
  notesLabel?: string;
  notes: NoteLink[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <details
      className={className ? `${styles.note} ${className}` : styles.note}
      data-study-note=""
      open
    >
      <summary className={styles.summary}>
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
        </span>
        <span className={styles.title}>{title}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.body}>{children}</div>
      {notes.length > 0 ? (
        <p className={styles.links}>
          <span className={styles.linksLabel}>{notesLabel}:</span>
          {notes.map((note) => (
            <a key={noteHref(note)} href={noteHref(note)}>
              {noteLabel(note)}
            </a>
          ))}
        </p>
      ) : null}
    </details>
  );
}
