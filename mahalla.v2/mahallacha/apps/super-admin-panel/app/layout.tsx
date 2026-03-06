import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LayoutShell } from "@mmbp/ui";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MMBP - Super Admin",
  description: "Mahalla Monitoring va Boshqaruv Platformasi - Super Admin boshqaruv paneli"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <Providers>
          <LayoutShell
            appTitle="MMBP Super Admin"
            navItems={[
              { href: "/", label: "Overview" },
              { href: "/users", label: "Users" },
              { href: "/roles", label: "Roles" },
              { href: "/permissions", label: "Permissions" },
              { href: "/regions", label: "Regions" },
              { href: "/mahallas", label: "Mahallas" },
              { href: "/audit-logs", label: "Audit Logs" },
              { href: "/security", label: "Security" },
              { href: "/settings", label: "Settings" }
            ]}
          >
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}

