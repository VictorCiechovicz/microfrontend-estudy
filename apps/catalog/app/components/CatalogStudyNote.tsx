import { type NoteLink, StudyNote } from "@lab/ui";
import type { ReactNode } from "react";
import { t } from "../../lib/i18n";
import styles from "../catalog/[lang]/catalog.module.css";

export async function CatalogStudyNote({
  notes,
  className = styles.studyNote,
  children,
}: {
  notes: NoteLink[];
  className?: string;
  children: ReactNode;
}) {
  return (
    <StudyNote
      title={await t("studyNoteTitle")}
      notesLabel={await t("studyNotesLabel")}
      notes={notes}
      className={className}
    >
      {children}
    </StudyNote>
  );
}
