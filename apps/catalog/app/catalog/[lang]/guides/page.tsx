import { Card, PageHeader } from "@lab/ui";
import Link from "next/link";
import { guides } from "../../../../lib/guides";
import { currentLang, t } from "../../../../lib/i18n";
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
