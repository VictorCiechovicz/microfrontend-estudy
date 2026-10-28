import { RemoteWidget } from "@lab/mf-host";
import { SiteFooter, SiteHeader } from "@lab/ui";
import "@lab/ui/styles.css";
import { StudyMode } from "@lab/ui/study";
import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { currentLang } from "../../../lib/i18n";
import { NotificationBadge } from "../../components/NotificationBadge";
import { UserSlot } from "../../components/UserSlot";
import "./view-transitions.css";

export const ensureStatic = "prefetch";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SHELL_URL ?? "http://localhost:3000"),
};

export function generateStaticParams() {
  return [{ lang: "pt" }, { lang: "en" }];
}

export default async function CatalogLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang={await currentLang()} data-zone="catalog">
      <body>
        <SiteHeader
          zone="catalog"
          cartSlot={<RemoteWidget name="CartWidget" />}
          userSlot={
            <>
              <Suspense fallback={null}>
                <NotificationBadge />
              </Suspense>
              <Suspense fallback={null}>
                <UserSlot />
              </Suspense>
            </>
          }
        />
        {children}
        <SiteFooter />
        <StudyMode zone="catalog" />
      </body>
    </html>
  );
}
