"use client";

import { AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import {
  useResidentNavigation,
  useResidentScrollRestore
} from "../hooks/useResidentNavigation";
import { PageTransition } from "./PageTransition";

interface AnimatedLayoutProps {
  children: ReactNode;
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const { pathname } = useResidentNavigation();
  useResidentScrollRestore(pathname);

  return (
    <div className="relative min-h-full w-full">
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={pathname} pathname={pathname}>
          {children}
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}
