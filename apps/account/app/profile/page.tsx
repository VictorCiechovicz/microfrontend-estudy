import { Card, PageHeader, Skeleton, StudyNote } from "@lab/ui";
import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "../../lib/data";
import { requireUserId } from "../../lib/session";
import styles from "../components/account.module.css";
import { ProfileForm as ProfileFormFields } from "./ProfileForm";

export default function ProfilePage() {
  return (
    <main>
      <Link href="/" className="lab-back">
        ← Minha conta
      </Link>
      <PageHeader
        eyebrow="Zona conta"
        title="Perfil"
        lead="Ao salvar, o novo nome aparece no header desta zona na hora e no catálogo na próxima visita."
      />
      <StudyNote className={styles.studyNote} notes={["update-tag"]}>
        <p>
          Salvar chama <code>updateTag(user:&lt;id&gt;:profile)</code>: a
          re-renderização devolvida pela Server Action já lê o nome novo, e o
          header muda sem recarregar.
        </p>
        <p>
          Shell e catálogo recebem o broadcast da tag, mas hoje nenhum dos dois
          a guarda em cache: o catálogo lê o nome direto do banco.
        </p>
      </StudyNote>
      <Card className={styles.formCard}>
        <Suspense fallback={<Skeleton label="Carregando perfil…" />}>
          <ProfileForm />
        </Suspense>
      </Card>
    </main>
  );
}

async function ProfileForm() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  return <ProfileFormFields name={profile?.name} />;
}
