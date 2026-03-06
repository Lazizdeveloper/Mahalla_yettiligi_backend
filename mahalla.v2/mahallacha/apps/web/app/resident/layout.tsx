"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutShell } from "@mmbp/ui";
import { AnimatedLayout } from "./components/AnimatedLayout";

export default function ResidentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden resident-mesh-dark">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="resident-blob resident-blob-glow absolute top-[10%] left-[5%] w-[320px] h-[320px] bg-blue-600/25" style={{ animationDuration: "24s", animationDelay: "0s" }} />
        <div className="resident-blob absolute top-[50%] right-[10%] w-[400px] h-[400px] bg-sky-600/20" style={{ animationDuration: "28s", animationDelay: "-5s" }} />
        <div className="resident-blob resident-blob-glow absolute bottom-[15%] left-[15%] w-[280px] h-[280px] bg-cyan-600/20" style={{ animationDuration: "26s", animationDelay: "-10s" }} />
        <div className="resident-blob absolute top-[30%] right-[30%] w-[200px] h-[200px] bg-blue-700/15" style={{ animationDuration: "20s", animationDelay: "-3s" }} />
      </div>
      <div className="relative z-10 w-full min-h-[calc(100vh-3.5rem)] rounded-none border-0 border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl my-0 overflow-hidden flex">
        <LayoutShell
          appTitle="Aholi"
          contentClassName="flex-1 overflow-auto bg-transparent"
          navItems={[
            { href: "/resident/dashboard", label: "Dashboard" },
            { href: "/resident/complaints", label: "Murojaatlarim" },
            { href: "/resident/reports", label: "Oylik baholash" },
            { href: "/resident/events", label: "Tadbirlar" }
          ]}
        >
          <AnimatedLayout>
            {children}

            <motion.div
              className="fixed z-40 sm:bottom-6 sm:right-6"
              style={{
                bottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))",
                right: "max(1.25rem, env(safe-area-inset-right, 1.25rem))"
              }}
              whileHover={{ scale: 1.08, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/resident/complaints"
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                +
              </Link>
            </motion.div>
          </AnimatedLayout>
        </LayoutShell>
      </div>
    </div>
  );
}

