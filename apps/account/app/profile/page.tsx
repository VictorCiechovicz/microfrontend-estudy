import { Card, PageHeader, Skeleton } from "@lab/ui";
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
