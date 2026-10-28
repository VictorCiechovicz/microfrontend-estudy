import { RemoteWidget } from "@lab/mf-host";
import Link from "next/link";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <main>
      <h1>Catalog</h1>
      <nav>
        <Link href={`/catalog/${lang}/guides`}>Guides</Link>
      </nav>
      <RemoteWidget name="HelloWidget" />
    </main>
  );
}
