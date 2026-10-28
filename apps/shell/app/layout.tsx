import { SiteFooter, SiteHeader } from "@lab/ui";
import "@lab/ui/styles.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-zone="shell">
      <body>
        <SiteHeader zone="shell" />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
