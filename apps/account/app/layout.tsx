import { SiteFooter, SiteHeader } from "@lab/ui";
import { type ReactNode, Suspense } from "react";
import { UserSlot } from "./components/UserSlot";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-zone="account">
      <body>
        <SiteHeader
          zone="account"
          userSlot={
            <Suspense fallback={null}>
              <UserSlot />
            </Suspense>
          }
        />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
