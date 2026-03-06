"use client";

import type { ReactNode } from "react";
import { LayoutShell } from "@/lib/layout-shell";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <LayoutShell
      appTitle="Super Admin"
      navItems={[
        { href: "/super-admin/dashboard", label: "Dashboard" },
        { href: "/super-admin/mahallas", label: "Mahallalar" },
        { href: "/super-admin/users", label: "Foydalanuvchilar" },
        { href: "/super-admin/audit-logs", label: "Audit loglar" }
      ]}
    >
      {children}
    </LayoutShell>
  );
}
