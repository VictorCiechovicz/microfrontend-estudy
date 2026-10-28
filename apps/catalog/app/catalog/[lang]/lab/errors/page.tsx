import { Suspense } from "react";
import { t } from "../../../../../lib/i18n";
import { ErrorLab } from "./ErrorLab";
import { HydrationMismatch } from "./HydrationMismatch";

type SearchParams = Promise<{ mismatch?: string }>;

export default async function ErrorLabPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (process.env.NODE_ENV === "production") {
    return (
      <main>
        <h1>{await t("errorLab")}</h1>
        <p>{await t("errorLabDevOnly")}</p>
      </main>
    );
  }
  return (
    <main>
      <h1>{await t("errorLab")}</h1>
      <ErrorLab
        labels={{
          causeChain: await t("errorLabCauseChain"),
          hydrationMismatch: await t("errorLabHydration"),
        }}
      />
      <Suspense fallback={null}>
        <MismatchSlot searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MismatchSlot({ searchParams }: { searchParams: SearchParams }) {
  return (await searchParams).mismatch ? <HydrationMismatch /> : null;
}
