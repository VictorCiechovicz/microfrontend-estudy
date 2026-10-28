import { Card, PageHeader } from "@lab/ui";
import Link from "next/link";
import { guides } from "../../../../lib/guides";
import { currentLang, t } from "../../../../lib/i18n";
import { CatalogStudyNote } from "../../../components/CatalogStudyNote";
import styles from "../catalog.module.css";

export default async function GuidesPage() {
  const lang = await currentLang();
  const readGuide = await t("readGuide");
  return (
    <main>
      <Link href={`/catalog/${lang}`} className="lab-back">
        {await t("backToCatalog")}
      </Link>
      <PageHeader title={await t("guides")} lead={await t("guidesLead")} />
      <CatalogStudyNote notes={["glob-imports", "proxy"]}>
        <p>
          Os guias são arquivos <code>.md</code> de{" "}
          <code>apps/catalog/content/guides</code>, importados no build com{" "}
          <code>import.meta.glob(…, {"{ eager: true, query: '?raw' }"})</code>,
          e uma regra <code>turbopack.rules</code> transforma o <code>.md</code>{" "}
          em texto. Não há lista no código: com <code>pnpm dev</code>, um
          arquivo novo na pasta aparece aqui.
        </p>
        <p>
          Um slug inexistente, como <code>/catalog/pt/guides/nope</code>,
          responde 404 pelo <code>proxy.ts</code> do catálogo.
        </p>
      </CatalogStudyNote>
      <ul className={styles.guides}>
        {guides.map((guide) => (
          <Card
            as="li"
            interactive
            key={guide.slug}
            className={styles.guideCard}
          >
            <h2>
              <Link href={`/catalog/${lang}/guides/${guide.slug}`}>
                {guide.title}
              </Link>
            </h2>
            <p className={styles.excerpt}>{guide.paragraphs[0]}</p>
            <span className={styles.more} aria-hidden="true">
              {readGuide} →
            </span>
          </Card>
        ))}
      </ul>
    </main>
  );
}
