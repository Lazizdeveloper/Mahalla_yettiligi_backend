import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LayoutShell } from "@mmbp/ui";

export const metadata: Metadata = {
  title: "MMBP - Aholi paneli",
  description: "Mahalla Monitoring va Boshqaruv Platformasi - Aholi paneli"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <LayoutShell
          appTitle="Aholi"
          navItems={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/complaints", label: "Murojaatlarim" },
            { href: "/reports", label: "Oylik baholash" }
          ]}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
