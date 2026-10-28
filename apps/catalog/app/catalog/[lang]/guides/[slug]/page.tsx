import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGuide, guides } from "../../../../../lib/guides";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

type Params = Promise<{ lang: string; slug: string }>;

export default function GuidePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main aria-busy="true" />}>
      <GuideArticle params={params} />
    </Suspense>
  );
}

async function GuideArticle({ params }: { params: Params }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return (
    <main>
      <article>
        <h1>{guide.title}</h1>
        {guide.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}
