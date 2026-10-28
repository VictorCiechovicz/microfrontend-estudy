import { Card, PageHeader } from "@lab/ui";
import { Suspense } from "react";
import { t } from "../../../../../lib/i18n";
import { CatalogStudyNote } from "../../../../components/CatalogStudyNote";
import styles from "../../catalog.module.css";
import { ErrorLab } from "./ErrorLab";
import { HydrationMismatch } from "./HydrationMismatch";

type SearchParams = Promise<{ mismatch?: string }>;

export default async function ErrorLabPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const header = (
    <>
      <PageHeader
        eyebrow={await t("catalogEyebrow")}
        title={await t("errorLab")}
        lead={await t("errorLabLead")}
      />
      <CatalogStudyNote notes={["error-overlay"]}>
        <p>
          O overlay de erros é do <code>next dev</code>: em produção esta página
          só mostra o aviso abaixo.
        </p>
        <p>
          Com <code>pnpm dev</code>, o erro com causa encadeada aparece no
          overlay com cada <code>Error.cause</code> num bloco "Caused by", e o
          hydration mismatch mostra o diff entre o HTML do servidor e o render
          do cliente.
        </p>
      </CatalogStudyNote>
    </>
  );
  if (process.env.NODE_ENV === "production") {
    return (
      <main>
        {header}
        <Card className={styles.notice}>
          <p>
            <strong>{await t("errorLabDevOnly")}</strong>
          </p>
          <p>{await t("errorLabHowTo")}</p>
        </Card>
      </main>
    );
  }
  return (
    <main>
      {header}
      <Card className={styles.notice}>
        <div className={styles.labActions}>
          <ErrorLab
            labels={{
              causeChain: await t("errorLabCauseChain"),
              hydrationMismatch: await t("errorLabHydration"),
            }}
          />
        </div>
        <Suspense fallback={null}>
          <MismatchSlot searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}

async function MismatchSlot({ searchParams }: { searchParams: SearchParams }) {
  return (await searchParams).mismatch ? <HydrationMismatch /> : null;
}
