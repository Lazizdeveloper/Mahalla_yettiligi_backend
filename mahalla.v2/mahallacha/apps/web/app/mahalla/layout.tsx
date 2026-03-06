"use client";

import type { ReactNode } from "react";
import { LayoutShell } from "@mmbp/ui";

export default function MahallaLayout({ children }: { children: ReactNode }) {
  return (
    <LayoutShell
      appTitle="Mahalla"
      theme="dark"
      navItems={[
        { href: "/mahalla/dashboard", label: "Dashboard" },
        { href: "/mahalla/posts", label: "E’lonlar" },
        { href: "/mahalla/events", label: "Tadbirlar" },
        { href: "/mahalla/complaints", label: "Shikoyatlar" },
        { href: "/mahalla/reports", label: "Oylik hisobotlar" },
        { href: "/mahalla/worktime", label: "Ish vaqti" }
      ]}
    >
      {children}
    </LayoutShell>
  );
}

