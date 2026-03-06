import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LayoutShell } from "@mmbp/ui";

export const metadata: Metadata = {
  title: "MMBP - Mahalla paneli",
  description: "Mahalla Monitoring va Boshqaruv Platformasi - Mahalla Yettiligi paneli"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <LayoutShell
          appTitle="Mahalla"
          navItems={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/posts", label: "E'lonlar" },
            { href: "/events", label: "Tadbirlar" },
            { href: "/complaints", label: "Shikoyatlar" },
            { href: "/reports", label: "Oylik hisobotlar" },
            { href: "/worktime", label: "Ish vaqti" }
          ]}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}

