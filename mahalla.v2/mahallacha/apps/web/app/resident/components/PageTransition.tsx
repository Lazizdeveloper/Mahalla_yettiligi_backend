"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransitionVariants, reducedVariants } from "../motion-variants";

interface PageTransitionProps {
  children: ReactNode;
  pathname: string;
}

export function PageTransition({ children, pathname }: PageTransitionProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <motion.div
        initial={reducedVariants.page.initial}
        animate={reducedVariants.page.animate}
        exit={reducedVariants.page.exit}
        transition={reducedVariants.page.transition}
        className="relative min-h-full w-full max-w-full min-w-0"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className="relative min-h-full w-full max-w-full min-w-0"
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
