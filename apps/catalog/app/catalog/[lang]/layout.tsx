import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ lang: "pt" }, { lang: "en" }];
}

export default async function CatalogLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={lang} data-zone="catalog">
      <body>{children}</body>
    </html>
  );
}
