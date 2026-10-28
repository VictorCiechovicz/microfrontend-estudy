import { SiteFooter, SiteHeader } from "@lab/ui";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-zone="account">
      <body>
        <SiteHeader zone="account" />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
