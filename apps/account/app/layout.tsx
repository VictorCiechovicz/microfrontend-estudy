import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-zone="account">
      <body>{children}</body>
    </html>
  );
}
