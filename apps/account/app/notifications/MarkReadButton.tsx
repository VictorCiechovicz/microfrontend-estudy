"use client";

import { Button } from "@lab/ui";
import { announceCacheReport } from "@lab/ui/study";
import { markReadAction } from "./actions";

export function MarkReadButton({ id }: { id: number }) {
  async function markRead() {
    const report = await markReadAction(id);
    if (report) announceCacheReport(report);
  }

  return (
    <form action={markRead}>
      <Button type="submit" variant="secondary" size="sm">
        Marcar como lida
      </Button>
    </form>
  );
}
