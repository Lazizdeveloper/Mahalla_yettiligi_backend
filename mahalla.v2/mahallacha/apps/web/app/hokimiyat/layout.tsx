"use client";

import type { ReactNode } from "react";
import { LayoutShell } from "@mmbp/ui";

export default function HokimiyatLayout({ children }: { children: ReactNode }) {
  return (
    <LayoutShell
      appTitle="Hokimiyat"
      theme="dark"
      navItems={[
        { href: "/hokimiyat/dashboard", label: "Dashboard" },
        { href: "/hokimiyat/mahallas", label: "Mahallalar reytingi" },
        { href: "/hokimiyat/complaints", label: "Shikoyatlar" },
        { href: "/hokimiyat/worktime", label: "Ish vaqti nazorati" },
        { href: "/hokimiyat/analytics", label: "Analitika" }
      ]}
    >
      {children}
    </LayoutShell>
  );
}

