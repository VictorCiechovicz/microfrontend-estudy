"use client";

import { Button } from "@lab/ui";
import { announceCacheReport } from "@lab/ui/study";
import styles from "../components/account.module.css";
import { updateProfileAction } from "./actions";

export function ProfileForm({ name }: { name: string | undefined }) {
  async function save(formData: FormData) {
    const report = await updateProfileAction(formData);
    if (report) announceCacheReport(report);
  }

  return (
    <form action={save} className={styles.form}>
      <label className={styles.field}>
        Nome
        <input name="name" defaultValue={name} required />
      </label>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
