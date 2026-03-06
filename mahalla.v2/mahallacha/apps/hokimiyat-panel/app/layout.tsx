import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LayoutShell } from "@mmbp/ui";

export const metadata: Metadata = {
  title: "MMBP - Hokimiyat paneli",
  description: "Mahalla Monitoring va Boshqaruv Platformasi - Hokimiyat paneli"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <LayoutShell
          appTitle="Hokimiyat"
          navItems={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/mahallas", label: "Mahallalar reytingi" },
            { href: "/complaints", label: "Shikoyatlar" },
            { href: "/worktime", label: "Ish vaqti nazorati" },
            { href: "/analytics", label: "Analitika" }
          ]}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
