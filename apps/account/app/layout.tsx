import { RemoteWidget } from "@lab/mf-host";
import { SiteFooter, SiteHeader } from "@lab/ui";
import "@lab/ui/styles.css";
import { type ReactNode, Suspense } from "react";
import { NotificationBadge } from "./components/NotificationBadge";
import { OfflineBanner } from "./components/OfflineBanner";
import { UserSlot } from "./components/UserSlot";

export default function RootLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <html lang="pt-BR" data-zone="account">
      <body>
        <SiteHeader
          zone="account"
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
        <OfflineBanner />
        {children}
        {modal}
        <SiteFooter />
      </body>
    </html>
  );
}
