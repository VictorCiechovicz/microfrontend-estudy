import Link from "next/link";
import { guides } from "../../../../lib/guides";
import { currentLang } from "../../../../lib/i18n";

export default async function GuidesPage() {
  const lang = await currentLang();
  return (
    <main>
      <h1>Guides</h1>
      <ul>
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link href={`/catalog/${lang}/guides/${guide.slug}`}>
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
