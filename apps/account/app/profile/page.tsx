import { Button, Card, PageHeader, Skeleton } from "@lab/ui";
import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "../../lib/data";
import { requireUserId } from "../../lib/session";
import styles from "../components/account.module.css";
import { updateProfileAction } from "./actions";

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
  return (
    <form action={updateProfileAction} className={styles.form}>
      <label className={styles.field}>
        Nome
        <input name="name" defaultValue={profile?.name} required />
      </label>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
