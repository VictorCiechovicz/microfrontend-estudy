import { Card, Skeleton } from "@lab/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGuide, guides } from "../../../../../lib/guides";
import { currentLang, t } from "../../../../../lib/i18n";
import styles from "../../catalog.module.css";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

type Params = Promise<{ lang: string; slug: string }>;

export default function GuidePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <main aria-busy="true">
          <Skeleton label="…" lines={4} />
        </main>
      }
    >
      <GuideArticle params={params} />
    </Suspense>
  );
}

async function GuideArticle({ params }: { params: Params }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const lang = await currentLang();
  return (
    <main>
      <Link href={`/catalog/${lang}/guides`} className="lab-back">
        {await t("backToGuides")}
      </Link>
      <Card as="article" className={styles.article}>
        <h1>{guide.title}</h1>
        {guide.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Card>
    </main>
  );
}
