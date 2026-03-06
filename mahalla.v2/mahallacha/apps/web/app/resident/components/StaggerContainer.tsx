"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import {
  cardContainerVariants,
  cardItemVariants,
  reducedVariants
} from "../motion-variants";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={cardContainerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={cardItemVariants}>
      {children}
    </motion.div>
  );
}
